const { ApiError } = require('../../util')
const { EMAIL_JOBS } = require('../../queue')

const createEmployerReviewService = ({ database, models, emailQueue }) => ({
  async listPending() {
    const profiles = await models.EmployerProfile.findAll({
      where: { verificationStatus: 'PENDING_REVIEW' },
      include: [{ model: models.User, as: 'user', attributes: ['id', 'email', 'fullName', 'emailVerifiedAt'] }],
      order: [['createdAt', 'ASC']],
    })
    return profiles.map((profile) => ({
      id: profile.id,
      companyName: profile.companyName,
      taxCode: profile.taxCode,
      businessLicenseNumber: profile.businessLicenseNumber,
      companyPhone: profile.companyPhone,
      companyAddress: profile.companyAddress,
      companyWebsite: profile.companyWebsite,
      representativeName: profile.representativeName,
      representativePosition: profile.representativePosition,
      createdAt: profile.createdAt,
      email: profile.user.email,
      accountName: profile.user.fullName,
      emailVerified: Boolean(profile.user.emailVerifiedAt),
    }))
  },
  async review(id, { decision, reason }) {
    const result = await database.transaction(async (transaction) => {
      const profile = await models.EmployerProfile.findByPk(id, {
        include: [{ model: models.User, as: 'user', attributes: ['email', 'fullName'] }],
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_NOT_FOUND')
      if (profile.verificationStatus !== 'PENDING_REVIEW') {
        throw new ApiError(409, 'Hồ sơ này đã được xử lý.', 'EMPLOYER_ALREADY_REVIEWED')
      }
      const verificationStatus = decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED'
      await profile.update({ verificationStatus, verifiedAt: decision === 'APPROVE' ? new Date() : null }, { transaction })
      return {
        id: profile.id,
        verificationStatus,
        email: profile.user.email,
        fullName: profile.user.fullName,
        companyName: profile.companyName,
        reason: decision === 'REJECT' ? reason.trim() : '',
      }
    })

    await emailQueue.add(EMAIL_JOBS.EMPLOYER_REVIEW, result, {
      jobId: `employer-review-${result.id}-${result.verificationStatus}`,
    })
    return { id: result.id, verificationStatus: result.verificationStatus }
  },
})

module.exports = { createEmployerReviewService }
