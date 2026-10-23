const crypto = require('node:crypto')

const { EMAIL_JOBS } = require('../../queue')
const { ApiError } = require('../../util/api-error')

const createPasswordResetService = ({ emailQueue, frontendOrigin, passwordResetRepository, passwordService, sessionRepository, transactionManager, userRepository }) => ({
  async request(email) {
    const user = await userRepository.findByEmail(email.trim().toLowerCase())
    if (!user || ['LOCKED', 'DISABLED'].includes(user.status)) return

    const token = crypto.randomBytes(48).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await transactionManager.transaction(async (transaction) => {
      await passwordResetRepository.invalidateByUser(user.id, { transaction })
      await passwordResetRepository.create({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      }, { transaction })
    })

    await emailQueue.add(EMAIL_JOBS.PASSWORD_RESET, {
      email: user.email,
      fullName: user.fullName,
      resetUrl: `${frontendOrigin}/reset-password?token=${encodeURIComponent(token)}`,
    }, { jobId: `password-reset-${user.id}-${Date.now()}` })
  },
  async reset({ token, password }) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await transactionManager.transaction(async (transaction) => {
      const resetToken = await passwordResetRepository.findActiveByHash(tokenHash, { transaction })
      if (!resetToken) throw new ApiError(422, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'PASSWORD_RESET_TOKEN_INVALID')
      const passwordHash = await passwordService.hash(password)
      await userRepository.updatePassword(resetToken.userId, passwordHash, { transaction })
      await passwordResetRepository.invalidateByUser(resetToken.userId, { transaction })
      await sessionRepository.revokeAllByUser(resetToken.userId, { transaction })
    })
  },
})

module.exports = { createPasswordResetService }
