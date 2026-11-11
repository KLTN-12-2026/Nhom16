const { db } = require('../../db')
const { ApiError } = require('../../util')
const { cvQualityService } = require('../ai/cv-quality.service')
const { isVietnameseCvQuality } = require('../ai/cv-quality-schema.service')

const DISCLAIMER = 'Kết quả do AI hỗ trợ phân tích chất lượng hồ sơ, không phải quyết định tuyển dụng cuối cùng.'

const toQualityAssessment = (assessment) => assessment ? {
  id: Number(assessment.id),
  analysisVersion: Number(assessment.analysisVersion),
  overallScore: Number(assessment.overallScore),
  criteria: assessment.criteria,
  strengths: Array.isArray(assessment.strengths) ? assessment.strengths : [],
  limitations: Array.isArray(assessment.limitations) ? assessment.limitations : [],
  assessedAt: assessment.assessedAt,
  disclaimer: DISCLAIMER,
} : null

const findCurrentAssessment = async (candidateCvId, analysisVersion) => {
  const assessment = await db.CvQualityAssessment.findOne({
    where: { candidateCvId, analysisVersion },
    order: [['assessedAt', 'DESC']],
  })
  return toQualityAssessment(assessment)
}

const assessCandidateCvQuality = async (userId, id, { force = false } = {}) => {
  const cv = await db.CandidateCv.findOne({ where: { id, userId } })
  if (!cv) throw new ApiError(404, 'Không tìm thấy CV.', 'CV_NOT_FOUND')
  if (!['completed', 'partial'].includes(cv.extractionStatus) || Number(cv.analysisVersion) < 1) {
    throw new ApiError(409, 'CV cần được phân tích nội dung trước khi đánh giá chất lượng.', 'CV_ANALYSIS_REQUIRED')
  }

  if (!force) {
    const current = await findCurrentAssessment(cv.id, cv.analysisVersion)
    if (current && isVietnameseCvQuality(current)) return current
  }

  const result = await cvQualityService.assess({
    headline: cv.headline,
    education: cv.education,
    experience: cv.experience,
    skills: cv.skills,
    certificates: cv.certificates,
    projects: cv.projects,
  })
  const now = new Date()
  const [assessment] = await db.CvQualityAssessment.upsert({
    candidateCvId: cv.id,
    analysisVersion: cv.analysisVersion,
    overallScore: result.overallScore,
    criteria: result.criteria,
    strengths: result.strengths,
    limitations: result.limitations,
    assessedAt: now,
  }, { returning: true })
  return toQualityAssessment(assessment)
}

module.exports = { assessCandidateCvQuality, findCurrentAssessment, toQualityAssessment }
