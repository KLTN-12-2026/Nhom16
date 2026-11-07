const { Op } = require('sequelize')
const { db } = require('../../db')
const { ApiError } = require('../../util')
const { APPLICATION_STATUS, assertApplicationTransition } = require('../job/job-workflow.service')
const { serializeJob } = require('../job/job.service')

const APPLICATION_STATUS_LABELS = {
  RECEIVED: 'Đã tiếp nhận',
  REVIEWING: 'Đang xem xét',
  INTERVIEW: 'Mời phỏng vấn',
  OFFER: 'Đề nghị nhận việc',
  REJECTED: 'Chưa phù hợp',
}

const applyToJob = async (userId, payload) => db.sequelize.transaction(async (transaction) => {
  const job = await db.Job.findOne({ where: { id: payload.jobId, status: 'ACTIVE', isPublic: true, isHidden: false, deadline: { [Op.gte]: new Date().toISOString().slice(0, 10) } }, transaction })
  if (!job) throw new ApiError(409, 'Tin tuyển dụng không còn nhận hồ sơ.', 'JOB_NOT_OPEN')
  const cv = await db.CandidateCv.findOne({ where: { id: payload.cvId, userId }, transaction })
  if (!cv) throw new ApiError(404, 'Không tìm thấy CV thuộc tài khoản của bạn.', 'CV_NOT_FOUND')
  const existing = await db.Application.findOne({ where: { jobId: job.id, candidateId: userId }, transaction })
  if (existing) throw new ApiError(409, 'Bạn đã ứng tuyển công việc này.', 'APPLICATION_ALREADY_EXISTS')
  const application = await db.Application.create({ jobId: job.id, candidateId: userId, candidateCvId: cv.id, coverLetter: payload.coverLetter || null, status: APPLICATION_STATUS.RECEIVED, appliedAt: new Date() }, { transaction })
  await db.ApplicationStatusHistory.create({ applicationId: application.id, fromStatus: null, toStatus: APPLICATION_STATUS.RECEIVED, changedById: userId }, { transaction })
  if (job.employerProfileId) {
    const [employerProfile, candidate] = await Promise.all([
      db.EmployerProfile.findByPk(job.employerProfileId, { attributes: ['userId'], transaction }),
      db.User.findByPk(userId, { attributes: ['fullName'], transaction }),
    ])
    if (employerProfile) {
      await db.Notification.create({
        userId: employerProfile.userId,
        type: 'NEW_APPLICATION',
        title: 'Có ứng viên mới',
        message: `${candidate?.fullName || 'Một ứng viên'} vừa ứng tuyển vị trí ${job.title}.`,
        entityType: 'APPLICATION',
        entityId: application.id,
      }, { transaction })
    }
  }
  return application
})

const listCandidateApplications = async (userId) => {
  const applications = await db.Application.findAll({
    where: { candidateId: userId },
    include: [{ model: db.Job, as: 'job', include: [{ model: db.JobCategory, as: 'category' }] }, { model: db.CandidateCv, as: 'cv', attributes: ['id', 'displayName', 'originalName'] }, { model: db.ApplicationStatusHistory, as: 'history' }],
    order: [['appliedAt', 'DESC'], [{ model: db.ApplicationStatusHistory, as: 'history' }, 'createdAt', 'ASC']],
  })
  return applications.map((application) => ({ ...application.toJSON(), job: serializeJob(application.job) }))
}

const getCandidateApplicationJob = async (userId, applicationId) => {
  const application = await db.Application.findOne({
    where: { id: applicationId, candidateId: userId },
    include: [{ model: db.Job, as: 'job', required: true, include: [{ model: db.JobCategory, as: 'category' }] }],
  })
  if (!application) throw new ApiError(404, 'Không tìm thấy JD thuộc hồ sơ ứng tuyển của bạn.', 'APPLICATION_JOB_NOT_FOUND')
  return serializeJob(application.job)
}

const listEmployerApplications = async (userId, query = {}) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')
  const where = {}
  if (query.status) where.status = query.status
  const jobWhere = { employerProfileId: profile.id }
  if (query.jobId) jobWhere.id = query.jobId
  return db.Application.findAll({ where, include: [{ model: db.Job, as: 'job', where: jobWhere, required: true }, { model: db.User, as: 'candidate', attributes: ['id', 'fullName', 'email'] }, { model: db.CandidateCv, as: 'cv', attributes: ['id', 'displayName', 'headline', 'skills'] }], order: [['appliedAt', 'DESC']] })
}

const updateApplicationStatus = async (userId, applicationId, payload) => db.sequelize.transaction(async (transaction) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId }, transaction })
  const application = await db.Application.findOne({ where: { id: applicationId }, include: [{ model: db.Job, as: 'job', where: { employerProfileId: profile?.id }, required: true }, { model: db.CandidateCv, as: 'cv', attributes: ['displayName'] }], transaction, lock: transaction.LOCK.UPDATE })
  if (!application) throw new ApiError(404, 'Không tìm thấy hồ sơ ứng tuyển thuộc doanh nghiệp.', 'APPLICATION_NOT_FOUND')
  assertApplicationTransition(application.status, payload.status)
  const previous = application.status
  await application.update({ status: payload.status }, { transaction })
  await db.ApplicationStatusHistory.create({ applicationId: application.id, fromStatus: previous, toStatus: payload.status, note: payload.note || null, changedById: userId }, { transaction })
  const statusLabel = APPLICATION_STATUS_LABELS[payload.status] || payload.status
  const rejected = payload.status === APPLICATION_STATUS.REJECTED
  await db.Notification.create({
    userId: application.candidateId,
    type: `APPLICATION_${payload.status}`,
    title: rejected ? `CV chưa phù hợp với vị trí ${application.job.title}` : 'Hồ sơ ứng tuyển đã được cập nhật',
    message: rejected
      ? `CV “${application.cv?.displayName || 'đã nộp'}” chưa được doanh nghiệp lựa chọn cho vị trí ${application.job.title}.${payload.note ? ` Phản hồi: ${payload.note}` : ''}`
      : `Hồ sơ ứng tuyển ${application.job.title} đã chuyển sang trạng thái “${statusLabel}”.`,
    entityType: 'APPLICATION',
    entityId: application.id,
  }, { transaction })
  return application
})

const getEmployerApplicationCv = async (userId, applicationId) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  const application = await db.Application.findOne({
    where: { id: applicationId },
    include: [{ model: db.Job, as: 'job', where: { employerProfileId: profile?.id }, required: true }, { model: db.CandidateCv, as: 'cv', required: true }],
  })
  if (!application) throw new ApiError(404, 'Không tìm thấy CV của hồ sơ ứng tuyển.', 'APPLICATION_CV_NOT_FOUND')
  return { absolutePath: application.cv.storagePath, downloadName: application.cv.originalName }
}

module.exports = { applyToJob, getCandidateApplicationJob, getEmployerApplicationCv, listCandidateApplications, listEmployerApplications, updateApplicationStatus }
