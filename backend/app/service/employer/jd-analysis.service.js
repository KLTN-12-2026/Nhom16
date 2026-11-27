const { db } = require('../../db')
const { Op } = require('sequelize')
const { env } = require('../../config')
const { ApiError } = require('../../util')
const { analyzeJobDescription } = require('../ai/recruitment-ai.service')
const { getOwnedJob } = require('./employer-job.service')

const serialize = (row) => row ? { ...row.toJSON(), id: Number(row.id), jobId: Number(row.jobId) } : null
const jobSource = (job) => ({ title: job.title, description: job.description, requirements: job.requirements || [], skills: job.skills || [], experienceLevel: job.experienceLevel, positionLevel: job.positionLevel, employmentType: job.employmentType })
const staleProcessingMs = Math.max(Math.min(env.ai.requestTimeoutMs, 90000) + 30000, 120000)
const stalePendingMs = Math.max(staleProcessingMs * 3, 600000)

const failAbandonedAnalyses = async () => {
  const now = Date.now()
  const rows = await db.JobJdAnalysis.findAll({ where: { status: { [Op.in]: ['PENDING', 'PROCESSING'] } } })
  await Promise.all(rows.filter((row) => {
    const age = now - new Date(row.updatedAt).getTime()
    return age > (row.status === 'PROCESSING' ? staleProcessingMs : stalePendingMs)
  }).map(row => row.update({
    status: 'FAILED',
    errorMessage: row.status === 'PROCESSING'
      ? 'Phiên AI đã quá thời gian xử lý. Vui lòng kiểm tra dịch vụ AI/worker rồi phân tích lại.'
      : 'Phiên AI chờ quá lâu nhưng worker chưa tiếp nhận. Vui lòng kiểm tra Redis/worker rồi thử lại.',
  })))
}

const listEmployerJdAnalyses = async (userId) => {
  await failAbandonedAnalyses()
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')
  const rows = await db.JobJdAnalysis.findAll({ include: [{ model: db.Job, as: 'job', where: { employerProfileId: profile.id }, attributes: ['id', 'title', 'company', 'description'] }], order: [['updatedAt', 'DESC']] })
  return rows.map(row => ({ ...serialize(row), job: row.job }))
}

const requestJdAnalysis = async (userId, jobId, aiQueue, force = false) => {
  await failAbandonedAnalyses()
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
const deleteJdAnalysis = async (userId, analysisId) => {
  const row = await db.JobJdAnalysis.findByPk(analysisId)
  if (!row) throw new ApiError(404, 'Không tìm thấy phiên phân tích JD.', 'JD_ANALYSIS_NOT_FOUND')
  await getOwnedJob(userId, row.jobId)
  if (['PENDING', 'PROCESSING'].includes(row.status)) throw new ApiError(409, 'Không thể xóa khi AI đang xử lý. Vui lòng đợi phiên kết thúc hoặc quá thời gian.', 'JD_ANALYSIS_IN_PROGRESS')
  await row.destroy()
  return { id: Number(row.id) }
}
const getJdAnalysis = async (userId, jobId) => { await getOwnedJob(userId, jobId); return serialize(await db.JobJdAnalysis.findOne({ where: { jobId }, order: [['analysisVersion', 'DESC']] })) }

module.exports = { confirmJdAnalysis, deleteJdAnalysis, getJdAnalysis, listEmployerJdAnalyses, processJdAnalysis, requestJdAnalysis, updateJdAnalysis }
