const { db } = require('../../db')
const { ApiError } = require('../../util')
const { OUT_OF_SCOPE_MESSAGE, isRecruitmentScopeRequest, isVietnameseCvImprovement } = require('../ai/cv-improvement-schema.service')
const { cvImprovementService } = require('../ai/cv-improvement.service')
const { isVietnameseCvQuality } = require('../ai/cv-quality-schema.service')

const DISCLAIMER = 'Gợi ý do AI hỗ trợ biên tập, bạn hãy rà soát và giữ đúng kinh nghiệm, số liệu thực tế của mình.'

const CONTACT_CHECKS = [
  { field: 'candidateName', label: 'họ tên', warning: 'Thiếu họ tên đầy đủ ở phần thông tin đầu CV.', pattern: /\b(họ\s*tên|full\s*name|tên\s*ứng\s*viên)\b/i },
  { field: 'candidateEmail', label: 'email liên hệ', warning: 'Thiếu địa chỉ email liên hệ chuyên nghiệp.', pattern: /\b(e-?mail|thư\s*điện\s*tử)\b/i },
  { field: 'candidatePhone', label: 'số điện thoại', warning: 'Thiếu số điện thoại liên hệ trực tiếp.', pattern: /\b(số\s*điện\s*thoại|điện\s*thoại|sđt|phone)\b/i },
]

const toImprovementSuggestion = (record) => record ? {
  id: Number(record.id),
  analysisVersion: Number(record.analysisVersion),
  targetRole: record.targetRole,
  recommendedSkills: Array.isArray(record.recommendedSkills) ? record.recommendedSkills : [],
  objectiveRewrite: record.objectiveRewrite,
  experienceRewrites: Array.isArray(record.experienceRewrites) ? record.experienceRewrites : [],
  educationSuggestion: record.educationSuggestion || null,
  presentationSuggestion: record.presentationSuggestion || null,
  warnings: record.warnings || { missingContacts: [], spellingOrExpression: [], missingSections: [] },
  generatedAt: record.generatedAt,
  disclaimer: DISCLAIMER,
} : null

const buildContactAudit = (cv) => {
  const missingChecks = CONTACT_CHECKS.filter(({ field }) => !String(cv[field] || '').trim())
  return {
    missingContactFields: missingChecks.map((item) => item.label),
    deterministicWarnings: missingChecks.map((item) => item.warning),
  }
}

const mergeContactWarnings = (aiContactWarnings, audit) => {
  // Deterministic CONTACT_CHECKS already cover name/email/phone cleanly, so filter AI repeats or false claims.
  const safeAiWarnings = (Array.isArray(aiContactWarnings) ? aiContactWarnings : [])
    .filter((warning) => !CONTACT_CHECKS.some(({ pattern }) => pattern.test(warning)))
  return [...new Set([...audit.deterministicWarnings, ...safeAiWarnings])].slice(0, 4)
}

const findCurrentSuggestion = async (candidateCvId, analysisVersion, models = db) => {
  const suggestion = await models.CvImprovementSuggestion.findOne({
    where: { candidateCvId, analysisVersion },
    order: [['generatedAt', 'DESC']],
  })
  return toImprovementSuggestion(suggestion)
}

const suggestCandidateCvImprovement = async (userId, id, {
  force = false,
  customRequest = '',
  improvementService = cvImprovementService,
  models = db,
} = {}) => {
  const normalizedRequest = String(customRequest || '').trim().slice(0, 300)
  if (!isRecruitmentScopeRequest(normalizedRequest)) {
    throw new ApiError(422, OUT_OF_SCOPE_MESSAGE, 'OUT_OF_SCOPE_REQUEST')
  }

  const cv = await models.CandidateCv.findOne({ where: { id, userId } })
  if (!cv) throw new ApiError(404, 'Không tìm thấy CV.', 'CV_NOT_FOUND')

  if (!['completed', 'partial'].includes(cv.extractionStatus) || Number(cv.analysisVersion) < 1) {
    throw new ApiError(409, 'CV cần được phân tích nội dung trước khi xem gợi ý cải thiện.', 'CV_ANALYSIS_REQUIRED')
  }

  const assessment = await models.CvQualityAssessment.findOne({
    where: { candidateCvId: cv.id, analysisVersion: cv.analysisVersion },
    order: [['assessedAt', 'DESC']],
  })
  if (!assessment || !isVietnameseCvQuality(assessment)) {
    throw new ApiError(409, 'CV cần được đánh giá chất lượng trước khi xem gợi ý cải thiện.', 'CV_QUALITY_ASSESSMENT_REQUIRED')
  }

  if (!force && !normalizedRequest) {
    const current = await findCurrentSuggestion(cv.id, cv.analysisVersion, models)
    if (current && isVietnameseCvImprovement(current)) return current
  }

  const audit = buildContactAudit(cv)
  const result = await improvementService.suggest({
    headline: cv.headline,
    education: cv.education,
    experience: cv.experience,
    skills: cv.skills,
    certificates: cv.certificates,
    projects: cv.projects,
    qualityLimitations: assessment.limitations,
    missingContactFields: audit.missingContactFields,
    customRequest: normalizedRequest,
  })

  const mergedWarnings = {
    ...result.warnings,
    missingContacts: mergeContactWarnings(result.warnings.missingContacts, audit),
  }

  const now = new Date()
  const [saved] = await models.CvImprovementSuggestion.upsert({
    candidateCvId: cv.id,
    analysisVersion: cv.analysisVersion,
    targetRole: result.targetRole,
    recommendedSkills: result.recommendedSkills,
    objectiveRewrite: result.objectiveRewrite,
    experienceRewrites: result.experienceRewrites,
    educationSuggestion: result.educationSuggestion,
    presentationSuggestion: result.presentationSuggestion,
    warnings: mergedWarnings,
    generatedAt: now,
  }, { returning: true })

  return toImprovementSuggestion(saved)
}

module.exports = {
  buildContactAudit,
  findCurrentSuggestion,
  mergeContactWarnings,
  suggestCandidateCvImprovement,
  toImprovementSuggestion,
}
