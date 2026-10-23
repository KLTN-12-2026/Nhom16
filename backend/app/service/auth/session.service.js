const crypto = require('node:crypto')

const { ApiError } = require('../../util')

const createSessionService = ({ sessionRepository, tokenService, transactionManager, userRepository }) => {
  const createSessionData = (userId, context = {}) => {
    const id = crypto.randomUUID()
    const refreshToken = tokenService.signRefresh(userId, id)
    const payload = tokenService.verifyRefresh(refreshToken)
    return {
      refreshToken,
      session: {
        id,
        userId,
        refreshTokenHash: tokenService.hash(refreshToken),
        expiresAt: new Date(payload.exp * 1000),
        ipAddress: context.ip || null,
        userAgent: context.userAgent || null,
      },
    }
  }

  return {
    async issue(user, context = {}) {
      const next = createSessionData(user.id, context)
      await sessionRepository.create(next.session)
      return { accessToken: tokenService.signAccess(user.id), refreshToken: next.refreshToken }
    },
    async rotate(refreshToken, context = {}) {
      const payload = tokenService.verifyRefresh(refreshToken)
      return transactionManager.transaction(async (transaction) => {
        const current = await sessionRepository.findByIdForUpdate(payload.sid, { transaction })
        const invalid = !current
          || current.userId.toString() !== payload.sub
          || current.refreshTokenHash !== tokenService.hash(refreshToken)
          || current.revokedAt
          || current.expiresAt <= new Date()
        if (invalid) throw new ApiError(401, 'Phiên làm mới không hợp lệ hoặc đã hết hạn.', 'REFRESH_TOKEN_INVALID')

        const user = await userRepository.findByIdWithRoles(payload.sub, { transaction })
        if (!user || ['LOCKED', 'DISABLED'].includes(user.status)) {
          throw new ApiError(401, 'Phiên đăng nhập không hợp lệ.', 'UNAUTHORIZED')
        }
        const next = createSessionData(user.id, context)
        await sessionRepository.create(next.session, { transaction })
        await sessionRepository.revoke(current.id, next.session.id, { transaction })
        return {
          user,
          tokens: { accessToken: tokenService.signAccess(user.id), refreshToken: next.refreshToken },
        }
      })
    },
    async revoke(refreshToken) {
      if (!refreshToken) return
      try {
        const payload = tokenService.verifyRefresh(refreshToken)
        await sessionRepository.revoke(payload.sid)
      } catch (error) {
        // Logout stays idempotent when a cookie is expired or malformed.
      }
    },
  }
}

const createLoginSession = (sessionService, user, context) => sessionService.issue(user, context)

module.exports = { createLoginSession, createSessionService }
