const { db } = require('../../db')
const { ApiError } = require('../../util')
const { calculateMatchScore, compareCvWithJob } = require('../ai/recruitment-ai.service')

const serialize = (row) => row ? {
  id: Number(row.id), cvId: Number(row.candidateCvId), jobId: Number(row.jobId), jdAnalysisId: Number(row.jobJdAnalysisId), cvAnalysisVersion: row.cvAnalysisVersion,
  status: row.status, metCriteria: row.metCriteria || [], partialCriteria: row.partialCriteria || [], missingCriteria: row.missingCriteria || [], explanation: row.explanation, errorMessage: row.errorMessage, comparedAt: row.comparedAt,
  matchScore: row.status === 'COMPLETED' ? calculateMatchScore(row) : null,
  job: row.job ? { id: Number(row.job.id), title: row.job.title, company: row.job.company, location: row.job.location } : undefined,
  cv: row.cv ? { id: Number(row.cv.id), displayName: row.cv.displayName, headline: row.cv.headline } : undefined,
} : null
const compactList = (value, maxItems = 12, maxLength = 500) => Array.isArray(value)
  ? value.slice(0, maxItems).map(item => String(item).trim().slice(0, maxLength)).filter(Boolean)
  : []
const cvData = cv => ({
  headline: String(cv.headline || '').slice(0, 220),
  education: compactList(cv.education, 6, 350),
  experience: compactList(cv.experience, 8, 600),
  skills: compactList(cv.skills, 20, 100),
  certificates: compactList(cv.certificates, 8, 300),
  projects: compactList(cv.projects, 8, 600),
})
const jdData = jd => ({ title: jd.title, summary: jd.summary, responsibilities: jd.responsibilities || [], requiredSkills: jd.requiredSkills || [], preferredSkills: jd.preferredSkills || [], experienceRequirements: jd.experienceRequirements || [], educationRequirements: jd.educationRequirements || [], keywords: jd.keywords || [], mandatoryRequirements: jd.mandatoryRequirements || [] })

const requestCvJobComparison = async (userId, { cvId, jobId, force = false }, aiQueue) => {
  const cv = await db.CandidateCv.findOne({ where: { id: cvId, userId } })
  if (!cv) throw new ApiError(404, 'Không tìm thấy CV thuộc tài khoản.', 'CANDIDATE_CV_NOT_FOUND')
  if (!['completed', 'partial'].includes(cv.extractionStatus)) throw new ApiError(409, 'CV cần được phân tích trước khi so sánh.', 'CV_ANALYSIS_REQUIRED')
  const job = await db.Job.findOne({ where: { id: jobId, status: 'ACTIVE', isPublic: true, isHidden: false } })
  if (!job) throw new ApiError(404, 'Tin tuyển dụng không còn khả dụng.', 'JOB_NOT_AVAILABLE')
  const jd = await db.JobJdAnalysis.findOne({ where: { jobId, status: 'COMPLETED' }, order: [['analysisVersion', 'DESC']] })
  if (!jd) throw new ApiError(409, 'JD chưa được AI phân tích. Nhà tuyển dụng cần phân tích JD trước.', 'JD_ANALYSIS_REQUIRED')
  let row = await db.CvJobComparison.findOne({ where: { candidateCvId: cv.id, jobJdAnalysisId: jd.id, cvAnalysisVersion: cv.analysisVersion } })
  if (row && !force && row.status === 'PENDING') {
    await aiQueue.addCvJobComparison({ comparisonId: row.id })
    return serialize(row)
  }
  if (row && !force && row.status === 'PROCESSING') {
    const staleAt = Date.now() - (2 * 60 * 1000)
    if (new Date(row.updatedAt).getTime() >= staleAt) return serialize(row)
    await row.update({ status: 'FAILED', errorMessage: 'Phiên đối chiếu trước đã quá thời gian xử lý. Vui lòng thử lại.' })
  }
  if (row && !force && row.status === 'COMPLETED') return serialize(row)
  if (row) await row.update({ status: 'PENDING', errorMessage: null, metCriteria: null, partialCriteria: null, missingCriteria: null, explanation: null })
  else row = await db.CvJobComparison.create({ candidateCvId: cv.id, jobId: job.id, jobJdAnalysisId: jd.id, cvAnalysisVersion: cv.analysisVersion, status: 'PENDING' })
  try {
    await aiQueue.addCvJobComparison({ comparisonId: row.id })
  } catch (error) {
    await row.update({ status: 'FAILED', errorMessage: 'Không thể kết nối hàng đợi AI. Vui lòng kiểm tra Redis và thử lại.' })
    throw error
  }
  return serialize(row)
}

const processCvJobComparison = async ({ comparisonId }) => {
  const row = await db.CvJobComparison.findByPk(comparisonId, { include: [{ model: db.CandidateCv, as: 'cv' }, { model: db.JobJdAnalysis, as: 'jdAnalysis' }] })
  if (!row) return null
  await row.update({ status: 'PROCESSING', errorMessage: null })
  try { const result = await compareCvWithJob({ cv: cvData(row.cv), jd: jdData(row.jdAnalysis) }); await row.update({ ...result, status: 'COMPLETED', comparedAt: new Date() }); return serialize(row) }
  catch (error) { await row.update({ status: 'FAILED', errorMessage: error.message.slice(0, 500) }); throw error }
}

const getCvJobComparison = async (userId, { cvId, jobId }) => {
  const cv = await db.CandidateCv.findOne({ where: { id: cvId, userId } })
  if (!cv) throw new ApiError(404, 'Không tìm thấy CV thuộc tài khoản.', 'CANDIDATE_CV_NOT_FOUND')
  const row = await db.CvJobComparison.findOne({ where: { candidateCvId: cv.id, jobId }, include: [{ model: db.Job, as: 'job' }, { model: db.CandidateCv, as: 'cv' }], order: [['updatedAt', 'DESC']] })
  return serialize(row)
}

const listCvJobComparisons = async userId => {
  const rows = await db.CvJobComparison.findAll({ include: [{ model: db.CandidateCv, as: 'cv', where: { userId }, required: true }, { model: db.Job, as: 'job' }], order: [['updatedAt', 'DESC']], limit: 20 })
  return rows.map(serialize)
}

const deleteCvJobComparison = async (userId, comparisonId) => {
  const row = await db.CvJobComparison.findOne({
    where: { id: comparisonId },
    include: [{ model: db.CandidateCv, as: 'cv', where: { userId }, required: true }],
  })
  if (!row) throw new ApiError(404, 'Không tìm thấy kết quả đối chiếu thuộc tài khoản.', 'CV_JOB_COMPARISON_NOT_FOUND')
  await row.destroy()
  return { id: Number(comparisonId) }
}

module.exports = { deleteCvJobComparison, getCvJobComparison, listCvJobComparisons, processCvJobComparison, requestCvJobComparison }
