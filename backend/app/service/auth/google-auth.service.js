const { OAuth2Client } = require('google-auth-library')

const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('../../constants')
const { EMAIL_JOBS } = require('../../queue')
const { ApiError } = require('../../util/api-error')
const { toAuthUser } = require('./authentication.service')

const createGoogleAuthService = ({ clientId, emailQueue, transactionManager, userRepository, roleRepository, identityRepository, recaptchaVerifier }) => {
  const client = new OAuth2Client(clientId)
  return {
    async authenticate(payload, context = {}) {
      if (!clientId) throw new ApiError(503, 'Đăng nhập Google chưa được cấu hình.', 'GOOGLE_AUTH_NOT_CONFIGURED')
      if (payload.role === ROLES.EMPLOYER) {
        throw new ApiError(422, 'Doanh nghiệp cần đăng ký bằng biểu mẫu xác minh.', 'EMPLOYER_VERIFICATION_REQUIRED')
      }
      const action = payload.role ? 'google_register' : 'google_login'
      await recaptchaVerifier.verify({ token: payload.recaptchaToken, action, remoteIp: context.ip })

      let googleProfile
      try {
        const ticket = await client.verifyIdToken({ idToken: payload.credential, audience: clientId })
        googleProfile = ticket.getPayload()
      } catch (error) {
        throw new ApiError(401, 'Thông tin xác thực Google không hợp lệ.', 'GOOGLE_TOKEN_INVALID')
      }
      if (!googleProfile?.sub || !googleProfile.email || googleProfile.email_verified !== true) {
        throw new ApiError(401, 'Tài khoản Google chưa xác minh email.', 'GOOGLE_EMAIL_NOT_VERIFIED')
      }

      const email = googleProfile.email.toLowerCase()
      const account = await transactionManager.transaction(async (transaction) => {
        const identity = await identityRepository.findByProviderSubject('GOOGLE', googleProfile.sub, { transaction })
        if (identity) return { userId: identity.userId, isNewUser: false }

        let user = await userRepository.findByEmail(email, { transaction })
        let isNewUser = false
        if (!user) {
          if (!payload.role || !PUBLIC_REGISTRATION_ROLES.includes(payload.role)) {
            throw new ApiError(404, 'Tài khoản chưa tồn tại. Vui lòng đăng ký trước.', 'ACCOUNT_NOT_FOUND')
          }
          const role = await roleRepository.findById(payload.role, { transaction })
          if (!role) throw new ApiError(503, 'Dữ liệu phân quyền chưa sẵn sàng.', 'ROLE_NOT_CONFIGURED')
          user = await userRepository.create({
            email,
            fullName: googleProfile.name || email.split('@')[0],
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          }, { transaction })
          await userRepository.assignRole(user.id, role.id, { transaction })
          isNewUser = true
        }
        await identityRepository.create({
          userId: user.id,
          provider: 'GOOGLE',
          providerSubject: googleProfile.sub,
          emailSnapshot: email,
        }, { transaction })
        return { userId: user.id, isNewUser }
      })

      const user = await userRepository.findByIdWithRoles(account.userId)
      if (['LOCKED', 'DISABLED'].includes(user.status)) {
        throw new ApiError(403, 'Tài khoản hiện không thể đăng nhập.', 'ACCOUNT_UNAVAILABLE')
      }
      await userRepository.updateLastLogin(user.id)
      if (account.isNewUser) {
        await emailQueue.add(EMAIL_JOBS.GOOGLE_WELCOME, {
          email: user.email,
          fullName: user.fullName,
        }, { jobId: `google-welcome-${user.id}` }).catch((error) => {
          console.error('Unable to enqueue Google welcome email:', error.message)
        })
      }
      return toAuthUser(user)
    },
  }
}

module.exports = { createGoogleAuthService }
