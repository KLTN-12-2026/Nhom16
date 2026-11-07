const { db } = require('../../db')
const { ApiError } = require('../../util')
const { JOB_STATUS, assertJobTransition } = require('../job/job-workflow.service')
const { serializeJob } = require('../job/job.service')

const getVerifiedEmployer = async (userId) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')
  return profile
}

const assertCanPublish = (profile) => {
  if (profile.verificationStatus !== 'VERIFIED') throw new ApiError(403, 'Doanh nghiệp cần được quản trị viên xác minh trước khi đăng tin.', 'EMPLOYER_NOT_VERIFIED')
}

const normalizeJobPayload = (payload, profile, userId) => ({
  categoryId: payload.categoryId, employerProfileId: profile.id, createdById: userId,
  title: payload.title.trim(), company: profile.companyName, companyLogo: profile.companyName.slice(0, 2).toUpperCase(), logoColor: 'green',
  salaryMin: payload.salaryMin || null, salaryMax: payload.salaryMax || null, location: payload.location.trim(),
  workMode: payload.workMode, experienceLevel: payload.experienceLevel, employmentType: payload.employmentType,
  positionLevel: payload.positionLevel, description: payload.description.trim(), requirements: payload.requirements,
  benefits: payload.benefits, skills: payload.skills, deadline: payload.deadline,
})

const listEmployerJobs = async (userId) => {
  const profile = await getVerifiedEmployer(userId)
  const jobs = await db.Job.findAll({ where: { employerProfileId: profile.id }, include: [{ model: db.JobCategory, as: 'category' }], order: [['createdAt', 'DESC']] })
  return jobs.map(serializeJob)
}

const getEmployerJob = async (userId, jobId) => {
  const { job } = await getOwnedJob(userId, jobId, { include: [{ model: db.JobCategory, as: 'category' }, { model: db.JobJdFile, as: 'jdFiles' }] })
  return serializeJob(job)
}

const createEmployerJob = async (userId, payload) => {
  const profile = await getVerifiedEmployer(userId)
  const shouldPublish = Boolean(payload.publish)
  if (shouldPublish) assertCanPublish(profile)
  return db.Job.create({
    ...normalizeJobPayload(payload, profile, userId),
    status: shouldPublish ? JOB_STATUS.ACTIVE : JOB_STATUS.DRAFT,
    isPublic: shouldPublish,
    isHidden: !shouldPublish,
    publishedAt: shouldPublish ? new Date() : new Date(0),
  })
}

const getOwnedJob = async (userId, jobId, options = {}) => {
  const profile = await getVerifiedEmployer(userId)
  const job = await db.Job.findOne({ where: { id: jobId, employerProfileId: profile.id }, ...options })
  if (!job) throw new ApiError(404, 'Không tìm thấy tin tuyển dụng thuộc doanh nghiệp.', 'EMPLOYER_JOB_NOT_FOUND')
  return { job, profile }
}

const updateEmployerJob = async (userId, jobId, payload) => {
  const { job, profile } = await getOwnedJob(userId, jobId)
  if ([JOB_STATUS.CLOSED, JOB_STATUS.EXPIRED].includes(job.status)) throw new ApiError(409, 'Không thể sửa tin đã đóng hoặc hết hạn.', 'JOB_NOT_EDITABLE')
  await job.update(normalizeJobPayload({ ...job.toJSON(), ...payload }, profile, userId))
  return job
}

const changeEmployerJobStatus = async (userId, jobId, nextStatus) => {
  const { job, profile } = await getOwnedJob(userId, jobId)
  assertJobTransition(job.status, nextStatus)
  if (nextStatus === JOB_STATUS.ACTIVE) assertCanPublish(profile)
  await job.update({
    status: nextStatus,
    isPublic: nextStatus === JOB_STATUS.ACTIVE,
    isHidden: nextStatus !== JOB_STATUS.ACTIVE,
    publishedAt: nextStatus === JOB_STATUS.ACTIVE ? new Date() : job.publishedAt,
    closedAt: nextStatus === JOB_STATUS.CLOSED ? new Date() : null,
  })
  return job
}

const cloneEmployerJob = async (userId, jobId) => {
  const { job, profile } = await getOwnedJob(userId, jobId)
  const values = normalizeJobPayload(job.toJSON(), profile, userId)
  return db.Job.create({ ...values, title: `${values.title} (Bản sao)`, status: JOB_STATUS.DRAFT, isPublic: false, isHidden: true, publishedAt: new Date(0), sourceKey: null })
}

module.exports = { changeEmployerJobStatus, cloneEmployerJob, createEmployerJob, getEmployerJob, getOwnedJob, listEmployerJobs, updateEmployerJob }
