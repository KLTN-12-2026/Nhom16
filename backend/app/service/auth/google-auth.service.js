const crypto = require('node:crypto')

const { OAuth2Client } = require('google-auth-library')

const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('../../constants')
const { EMAIL_JOBS } = require('../../queue')
const { ApiError } = require('../../util')
const { toAuthUser } = require('./authentication.service')

let googleAuthService

const maskEmail = (email) => {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`
}

const createGoogleAuthService = ({ clientId, emailQueue, employerProfileRepository, identityRepository, otpSecret, recaptchaVerifier, redis, roleRepository, transactionManager, userRepository }) => {
  const client = new OAuth2Client(clientId)
  const challengeKey = (id) => `google-auth:challenge:${id}`
  const hashCode = (id, code) => crypto.createHash('sha256').update(`${id}:${code}:${otpSecret}`).digest('hex')

  return {
    async start(payload, context = {}) {
      if (!clientId) throw new ApiError(503, 'Đăng nhập Google chưa được cấu hình.', 'GOOGLE_AUTH_NOT_CONFIGURED')
      await recaptchaVerifier.verify({ token: payload.recaptchaToken, action: 'google_login', remoteIp: context.ip })

      let profile
      try {
        const ticket = await client.verifyIdToken({ idToken: payload.credential, audience: clientId })
        profile = ticket.getPayload()
      } catch (error) {
        throw new ApiError(401, 'Thông tin xác thực Google không hợp lệ.', 'GOOGLE_TOKEN_INVALID')
      }
      if (!profile?.sub || !profile.email || profile.email_verified !== true) {
        throw new ApiError(401, 'Tài khoản Google chưa xác minh email.', 'GOOGLE_EMAIL_NOT_VERIFIED')
      }

      const email = profile.email.toLowerCase()
      const identity = await identityRepository.findByProviderSubject('GOOGLE', profile.sub)
      const existingUser = identity
        ? await userRepository.findByIdWithRoles(identity.userId)
        : await userRepository.findByEmailWithRoles(email)
      const challengeId = crypto.randomUUID()
      const code = crypto.randomInt(100000, 1000000).toString()
      await redis.set(challengeKey(challengeId), JSON.stringify({
        codeHash: hashCode(challengeId, code),
        attempts: 0,
        lastSentAt: Math.floor(Date.now() / 1000),
        email,
        fullName: profile.name || email.split('@')[0],
        providerSubject: profile.sub,
        userId: existingUser?.id || null,
      }), 'EX', 600)

      await emailQueue.add(EMAIL_JOBS.GOOGLE_OTP, {
        code,
        email,
        fullName: profile.name || email.split('@')[0],
      }, { jobId: `google-otp-${challengeId}` })

      return { challengeId, email: maskEmail(email), requiresProfile: !existingUser }
    },

    async resend(payload) {
      const code = crypto.randomInt(100000, 1000000).toString()
      const now = Math.floor(Date.now() / 1000)
      const script = `
        local raw = redis.call('GET', KEYS[1])
        if not raw then return -1 end
        local value = cjson.decode(raw)
        local remaining = 15 - (${now} - (value.lastSentAt or 0))
        if remaining > 0 then return remaining end
        value.codeHash = ARGV[1]
        value.attempts = 0
        value.lastSentAt = ${now}
        redis.call('SET', KEYS[1], cjson.encode(value), 'EX', 600)
        return 0
      `
      const result = await redis.eval(
        script,
        1,
        challengeKey(payload.challengeId),
        hashCode(payload.challengeId, code),
      )
      if (result === -1) throw new ApiError(422, 'Phiên xác minh đã hết hạn. Vui lòng chọn lại tài khoản Google.', 'GOOGLE_CHALLENGE_EXPIRED')
      if (result > 0) throw new ApiError(429, `Vui lòng chờ ${result} giây trước khi gửi lại mã.`, 'GOOGLE_OTP_COOLDOWN', { retryAfter: result })

      const raw = await redis.get(challengeKey(payload.challengeId))
      const challenge = JSON.parse(raw)
      await emailQueue.add(EMAIL_JOBS.GOOGLE_OTP, {
        code,
        email: challenge.email,
        fullName: challenge.fullName,
      }, { jobId: `google-otp-${payload.challengeId}-${now}` })
      return { cooldownSeconds: 15 }
    },

    async complete(payload) {
      const key = challengeKey(payload.challengeId)
      const expectedHash = hashCode(payload.challengeId, payload.code)
      const script = `
        local raw = redis.call('GET', KEYS[1])
        if not raw then return nil end
        local value = cjson.decode(raw)
        if value.attempts >= 5 then redis.call('DEL', KEYS[1]); return nil end
        if value.codeHash ~= ARGV[1] then
          value.attempts = value.attempts + 1
          redis.call('SET', KEYS[1], cjson.encode(value), 'KEEPTTL')
          return nil
        end
        redis.call('DEL', KEYS[1])
        return raw
      `
      const raw = await redis.eval(script, 1, key, expectedHash)
      if (!raw) throw new ApiError(422, 'Mã xác minh không đúng hoặc đã hết hạn.', 'GOOGLE_OTP_INVALID')
      const challenge = JSON.parse(raw)

      const result = await transactionManager.transaction(async (transaction) => {
        let user = challenge.userId
          ? await userRepository.findByIdWithRoles(challenge.userId, { transaction })
          : null
        let isNewUser = false

        if (!user) {
          if (!PUBLIC_REGISTRATION_ROLES.includes(payload.role)) {
            throw new ApiError(422, 'Vui lòng chọn loại tài khoản.', 'ROLE_REQUIRED')
          }
          const role = await roleRepository.findById(payload.role, { transaction })
          if (!role) throw new ApiError(503, 'Dữ liệu phân quyền chưa sẵn sàng.', 'ROLE_NOT_CONFIGURED')
          user = await userRepository.create({
            email: challenge.email,
            fullName: challenge.fullName,
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          }, { transaction })
          await userRepository.assignRole(user.id, role.id, { transaction })
          if (payload.role === ROLES.EMPLOYER) {
            const company = await employerProfileRepository.findByTaxCode(payload.taxCode, { transaction })
            if (company) throw new ApiError(409, 'Mã số thuế này đã được đăng ký.', 'TAX_CODE_ALREADY_EXISTS')
            await employerProfileRepository.create({
              userId: user.id,
              companyName: payload.companyName,
              taxCode: payload.taxCode,
              businessLicenseNumber: payload.businessLicenseNumber,
              companyPhone: payload.companyPhone,
              companyAddress: payload.companyAddress,
              companyWebsite: payload.companyWebsite,
              representativeName: payload.representativeName,
              representativePosition: payload.representativePosition,
              verificationStatus: 'PENDING_REVIEW',
            }, { transaction })
          }
          isNewUser = true
        } else if (user.status === 'PENDING_VERIFICATION') {
          await userRepository.markEmailVerified(user.id, { transaction })
        }

        if (['LOCKED', 'DISABLED'].includes(user.status)) {
          throw new ApiError(403, 'Tài khoản hiện không thể đăng nhập.', 'ACCOUNT_UNAVAILABLE')
        }
        const identity = await identityRepository.findByProviderSubject('GOOGLE', challenge.providerSubject, { transaction })
        if (!identity) {
          await identityRepository.create({
            userId: user.id,
            provider: 'GOOGLE',
            providerSubject: challenge.providerSubject,
            emailSnapshot: challenge.email,
          }, { transaction })
        }
        return { isNewUser, userId: user.id }
      })

      const user = await userRepository.findByIdWithRoles(result.userId)
      await userRepository.updateLastLogin(user.id)
      if (result.isNewUser) {
        await emailQueue.add(EMAIL_JOBS.GOOGLE_WELCOME, { email: user.email, fullName: user.fullName }, { jobId: `google-welcome-${user.id}` })
      }
      return toAuthUser(user)
    },
  }
}

const initGoogleAuthService = (dependencies) => {
  googleAuthService = createGoogleAuthService(dependencies)
  return googleAuthService
}

const startGoogleAuth = (payload, context) => googleAuthService.start(payload, context)
const completeGoogleAuth = (payload) => googleAuthService.complete(payload)
const resendGoogleAuthCode = (payload) => googleAuthService.resend(payload)

module.exports = {
  completeGoogleAuth,
  createGoogleAuthService,
  initGoogleAuthService,
  resendGoogleAuthCode,
  startGoogleAuth,
}
