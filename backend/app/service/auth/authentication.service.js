const { ROLE_PERMISSIONS } = require('../../constants')
const { db } = require('../../db')
const { ApiError } = require('../../util')

let userSignInDependencies

const toAuthUser = (user) => {
  const role = user.roles?.[0]?.id
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    status: user.status,
  }
}

const authenticateCredentials = async ({ passwordService }, { email, password }) => {
  const user = await db.User.findOne({
    where: { email: email.trim().toLowerCase() },
    include: [{
      model: db.Role,
      as: 'roles',
      through: { attributes: [] },
    }],
  })
  const passwordValid = user?.passwordHash && await passwordService.compare(password, user.passwordHash)

  if (!passwordValid) {
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS')
  }
  if (['LOCKED', 'DISABLED'].includes(user.status)) {
    throw new ApiError(403, 'Tài khoản hiện không thể đăng nhập.', 'ACCOUNT_UNAVAILABLE')
  }
  if (user.status === 'PENDING_VERIFICATION') {
    throw new ApiError(403, 'Vui lòng xác minh email trước khi đăng nhập.', 'EMAIL_NOT_VERIFIED')
  }

  await user.update({ lastLoginAt: new Date() })
  return toAuthUser(user)
}

const initUserSignIn = (dependencies) => {
  userSignInDependencies = dependencies
}

const userSignIn = async ({ email, password, recaptchaToken }, context = {}) => {
  if (!userSignInDependencies) {
    throw new ApiError(503, 'Dịch vụ đăng nhập chưa được khởi tạo.', 'AUTH_NOT_INITIALIZED')
  }

  const {
    passwordService,
    recaptchaVerifier,
    sessionService,
  } = userSignInDependencies

  await recaptchaVerifier.verify({
    token: recaptchaToken,
    action: 'login',
    remoteIp: context.ip,
  })

  if (!email?.trim() || !password) {
    throw new ApiError(400, 'Vui lòng nhập email và mật khẩu.', 'INVALID_CREDENTIALS')
  }

  const user = await authenticateCredentials(
    { passwordService },
    { email, password },
  )
  const tokens = await sessionService.issue(user, context)

  return { tokens, user }
}

const createAuthenticationService = ({ userRepository, passwordService, tokenService }) => ({
  async authenticateLocal(payload) {
    return authenticateCredentials({ passwordService }, payload)
  },
  createAccessToken(user) {
    return tokenService.signAccess(user.id)
  },
  async getCurrentUserFromPayload(payload) {
    if (!payload?.sub || payload.type !== 'access') {
      throw new ApiError(401, 'Phiên đăng nhập không hợp lệ.', 'UNAUTHORIZED')
    }
    const user = await userRepository.findByIdWithRoles(payload.sub)
    if (!user || ['LOCKED', 'DISABLED'].includes(user.status)) {
      throw new ApiError(401, 'Phiên đăng nhập không hợp lệ.', 'UNAUTHORIZED')
    }
    return toAuthUser(user)
  },
})

module.exports = { createAuthenticationService, initUserSignIn, toAuthUser, userSignIn }
