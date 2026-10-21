const { ROLE_PERMISSIONS } = require('../../constants')
const { ApiError } = require('../../util/api-error')

const toAuthUser = (user) => {
  const role = user.roles?.[0]?.code
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    status: user.status,
  }
}

const createAuthenticationService = ({ userRepository, passwordService, recaptchaVerifier, tokenService }) => ({
  async login(payload, context = {}) {
    await recaptchaVerifier.verify({ token: payload.recaptchaToken, action: 'login', remoteIp: context.ip })
    const user = await userRepository.findByEmailWithRoles(payload.email.trim().toLowerCase())
    const passwordValid = user?.passwordHash && await passwordService.compare(payload.password, user.passwordHash)
    if (!passwordValid) throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS')
    if (['LOCKED', 'DISABLED'].includes(user.status)) {
      throw new ApiError(403, 'Tài khoản hiện không thể đăng nhập.', 'ACCOUNT_UNAVAILABLE')
    }
    await userRepository.updateLastLogin(user.id)
    return { user: toAuthUser(user), accessToken: tokenService.sign(user.id) }
  },
  async getCurrentUser(accessToken) {
    if (!accessToken) throw new ApiError(401, 'Bạn chưa đăng nhập.', 'UNAUTHORIZED')
    const payload = tokenService.verify(accessToken)
    const user = await userRepository.findByIdWithRoles(payload.sub)
    if (!user || ['LOCKED', 'DISABLED'].includes(user.status)) {
      throw new ApiError(401, 'Phiên đăng nhập không hợp lệ.', 'UNAUTHORIZED')
    }
    return toAuthUser(user)
  },
})

module.exports = { createAuthenticationService, toAuthUser }
