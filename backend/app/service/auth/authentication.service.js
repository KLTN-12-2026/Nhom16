const { ROLE_PERMISSIONS } = require('../../constants')
const { ApiError } = require('../../util')

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

const createAuthenticationService = ({ userRepository, passwordService, tokenService }) => ({
  async authenticateLocal(payload) {
    const user = await userRepository.findByEmailWithRoles(payload.email.trim().toLowerCase())
    const passwordValid = user?.passwordHash && await passwordService.compare(payload.password, user.passwordHash)
    if (!passwordValid) throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS')
    if (['LOCKED', 'DISABLED'].includes(user.status)) {
      throw new ApiError(403, 'Tài khoản hiện không thể đăng nhập.', 'ACCOUNT_UNAVAILABLE')
    }
    if (user.status === 'PENDING_VERIFICATION') {
      throw new ApiError(403, 'Vui lòng xác minh email trước khi đăng nhập.', 'EMAIL_NOT_VERIFIED')
    }
    await userRepository.updateLastLogin(user.id)
    return toAuthUser(user)
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

module.exports = { createAuthenticationService, toAuthUser }
