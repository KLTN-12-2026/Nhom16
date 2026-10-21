const jwt = require('jsonwebtoken')

const { ApiError } = require('../../util/api-error')

const createTokenService = ({ secret, expiresIn = '15m' }) => ({
  sign(userId) {
    if (!secret) throw new ApiError(503, 'Dịch vụ đăng nhập chưa được cấu hình.', 'AUTH_NOT_CONFIGURED')
    return jwt.sign({ sub: String(userId), type: 'access' }, secret, { expiresIn })
  },
  verify(token) {
    try {
      const payload = jwt.verify(token, secret)
      if (payload.type !== 'access') throw new Error('Invalid token type')
      return payload
    } catch (error) {
      throw new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 'UNAUTHORIZED')
    }
  },
})

module.exports = { createTokenService }
