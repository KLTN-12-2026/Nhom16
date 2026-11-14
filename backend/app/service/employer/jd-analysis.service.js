const { db } = require('../../db')
const { ApiError } = require('../../util')
const { analyzeJobDescription } = require('../ai/recruitment-ai.service')
const { getOwnedJob } = require('./employer-job.service')

const serialize = (row) => row ? { ...row.toJSON(), id: Number(row.id), jobId: Number(row.jobId) } : null
const jobSource = (job) => ({ title: job.title, description: job.description, requirements: job.requirements || [], skills: job.skills || [], experienceLevel: job.experienceLevel, positionLevel: job.positionLevel, employmentType: job.employmentType })

const listEmployerJdAnalyses = async (userId) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')
  const rows = await db.JobJdAnalysis.findAll({ include: [{ model: db.Job, as: 'job', where: { employerProfileId: profile.id }, attributes: ['id', 'title', 'company', 'description'] }], order: [['updatedAt', 'DESC']] })
  return rows.map(row => ({ ...serialize(row), job: row.job }))
}

const requestJdAnalysis = async (userId, jobId, aiQueue, force = false) => {
  const { job } = await getOwnedJob(userId, jobId)
  const latest = await db.JobJdAnalysis.findOne({ where: { jobId: job.id }, order: [['analysisVersion', 'DESC']] })
  if (latest && !force && latest.status === 'PENDING') {
    await aiQueue.addJdAnalysis({ analysisId: latest.id })
    return serialize(latest)
  }
  if (latest && !force && ['PROCESSING', 'COMPLETED'].includes(latest.status)) return serialize(latest)
  const row = await db.JobJdAnalysis.create({ jobId: job.id, analysisVersion: (latest?.analysisVersion || 0) + 1, status: 'PENDING' })
  try {
    await aiQueue.addJdAnalysis({ analysisId: row.id })
  } catch (error) {
    await row.update({ status: 'FAILED', errorMessage: 'Không thể kết nối hàng đợi AI. Vui lòng kiểm tra Redis và thử lại.' })
    throw error
  }
  return serialize(row)
}

const processJdAnalysis = async ({ analysisId }) => {
  const row = await db.JobJdAnalysis.findByPk(analysisId, { include: [{ model: db.Job, as: 'job' }] })
  if (!row) return null
  await row.update({ status: 'PROCESSING', errorMessage: null })
  try { const result = await analyzeJobDescription(jobSource(row.job)); await row.update({ ...result, status: 'COMPLETED', analyzedAt: new Date() }); return serialize(row) }
  catch (error) { await row.update({ status: 'FAILED', errorMessage: error.message.slice(0, 500) }); throw error }
}

const updateJdAnalysis = async (userId, analysisId, payload) => {
  const row = await db.JobJdAnalysis.findByPk(analysisId, { include: [{ model: db.Job, as: 'job' }] })
  if (!row) throw new ApiError(404, 'Không tìm thấy kết quả phân tích JD.', 'JD_ANALYSIS_NOT_FOUND')
  await getOwnedJob(userId, row.jobId)
  const allowed = ['title', 'summary', 'responsibilities', 'requiredSkills', 'preferredSkills', 'experienceRequirements', 'educationRequirements', 'keywords', 'mandatoryRequirements']
  const changes = Object.fromEntries(allowed.filter(key => payload[key] !== undefined).map(key => [key, payload[key]]))
  await row.update({ ...changes, isConfirmed: false, confirmedAt: null })
  return serialize(row)
}
const confirmJdAnalysis = async (userId, analysisId) => { const row = await db.JobJdAnalysis.findByPk(analysisId); if (!row) throw new ApiError(404, 'Không tìm thấy kết quả phân tích JD.', 'JD_ANALYSIS_NOT_FOUND'); await getOwnedJob(userId, row.jobId); if (row.status !== 'COMPLETED') throw new ApiError(409, 'Chỉ có thể xác nhận kết quả đã phân tích xong.', 'JD_ANALYSIS_NOT_READY'); await row.update({ isConfirmed: true, confirmedAt: new Date() }); return serialize(row) }
const getJdAnalysis = async (userId, jobId) => { await getOwnedJob(userId, jobId); return serialize(await db.JobJdAnalysis.findOne({ where: { jobId }, order: [['analysisVersion', 'DESC']] })) }

module.exports = { confirmJdAnalysis, getJdAnalysis, listEmployerJdAnalyses, processJdAnalysis, requestJdAnalysis, updateJdAnalysis }
