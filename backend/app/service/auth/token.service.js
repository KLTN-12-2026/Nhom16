const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')

const { ApiError } = require('../../util/api-error')
const { unauthorizedError } = require('../../util/error.helper')

const createTokenService = ({ accessSecret, accessExpiresIn = '15m', refreshSecret, refreshExpiresIn = '7d' }) => ({
  signAccess(userId) {
    if (!accessSecret) throw new ApiError(503, 'Dịch vụ đăng nhập chưa được cấu hình.', 'AUTH_NOT_CONFIGURED')
    return jwt.sign({ sub: String(userId), type: 'access' }, accessSecret, { expiresIn: accessExpiresIn })
  },
  signRefresh(userId, sessionId) {
    if (!refreshSecret) throw new ApiError(503, 'Dịch vụ đăng nhập chưa được cấu hình.', 'AUTH_NOT_CONFIGURED')
    return jwt.sign({ sub: String(userId), sid: sessionId, type: 'refresh' }, refreshSecret, { expiresIn: refreshExpiresIn })
  },
  verify(token) {
    try {
      const payload = jwt.verify(token, accessSecret)
      if (payload.type !== 'access') throw new Error('Invalid token type')
      return payload
    } catch (error) {
      throw unauthorizedError()
    }
  },
  verifyRefresh(token) {
    try {
      const payload = jwt.verify(token, refreshSecret)
      if (payload.type !== 'refresh' || !payload.sid) throw new Error('Invalid token type')
      return payload
    } catch (error) {
      throw new ApiError(401, 'Phiên làm mới không hợp lệ hoặc đã hết hạn.', 'REFRESH_TOKEN_INVALID')
    }
  },
  hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
  },
})

module.exports = { createTokenService }
