const crypto = require('node:crypto')

const { EMAIL_JOBS } = require('../../queue')
const { ApiError } = require('../../util')

const createEmailVerificationService = ({ emailQueue, emailVerificationRepository, frontendOrigin, transactionManager, userRepository }) => {
  const issue = async (user) => {
    if (!user || user.status !== 'PENDING_VERIFICATION') return
    const token = crypto.randomBytes(48).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const tokenId = crypto.randomUUID()

    await transactionManager.transaction(async (transaction) => {
      await emailVerificationRepository.invalidateByUser(user.id, { transaction })
      await emailVerificationRepository.create({
        id: tokenId,
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }, { transaction })
    })

    await emailQueue.add(EMAIL_JOBS.EMAIL_VERIFICATION, {
      email: user.email,
      fullName: user.fullName,
      verificationUrl: `${frontendOrigin}/verify-email?token=${encodeURIComponent(token)}`,
    }, { jobId: `email-verification-${tokenId}` })
  }

  return {
    issue,
    async resend(email) {
      const user = await userRepository.findByEmail(email.trim().toLowerCase())
      await issue(user)
    },
    async verify(token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      await transactionManager.transaction(async (transaction) => {
        const verification = await emailVerificationRepository.findActiveByHash(tokenHash, { transaction })
        if (!verification) throw new ApiError(422, 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.', 'EMAIL_VERIFICATION_TOKEN_INVALID')
        await userRepository.markEmailVerified(verification.userId, { transaction })
        await emailVerificationRepository.invalidateByUser(verification.userId, { transaction })
      })
    },
  }
}

module.exports = { createEmailVerificationService }
