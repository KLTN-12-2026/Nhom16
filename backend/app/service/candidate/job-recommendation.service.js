const { Op } = require('sequelize')

const { db } = require('../../db')
const { ApiError } = require('../../util')
const { calculateMatchScore } = require('../ai/recruitment-ai.service')
const { serializeJob } = require('../job/job.service')

const ANALYZED_CV_STATUSES = ['completed', 'partial']
const STOP_WORDS = new Set([
  'va', 'voi', 'cho', 'cua', 'cac', 'nhung', 'trong', 'tren', 'duoi', 'tu', 'den', 've',
  'la', 'co', 'kinh', 'nghiem', 'yeu', 'cau', 'cong', 'viec', 'kha', 'nang', 'lam', 'biet',
  'su', 'dung', 'tot', 'uu', 'tien', 'ung', 'vien', 'nam', 'toi', 'thieu', 'hoac', 'duoc',
  'tham', 'gia', 'phat', 'trien', 'xay', 'dung', 'he', 'thong', 'ung', 'dung', 'and', 'with',
  'for', 'the', 'of', 'in', 'on', 'to', 'from', 'experience', 'knowledge', 'skills', 'ability',
])

const todayIso = () => new Date().toISOString().slice(0, 10)

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()

const normalizedKey = (value) => normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim()

const tokenize = (value) => normalizedKey(value)
  .split(/\s+/)
  .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))

const toStringList = (items) => {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  const result = []
  items.forEach((item) => {
    const text = typeof item === 'string'
      ? item.trim()
      : (item && typeof item === 'object' ? String(item.criterion || item.title || item.name || item.role || item.skill || '').trim() : '')
    const key = normalizedKey(text)
    if (!key || seen.has(key)) return
    seen.add(key)
    result.push(text)
  })
  return result
}

const formatExperienceEntry = (entry) => {
  if (typeof entry === 'string') return entry
  if (!entry || typeof entry !== 'object') return ''
  return [entry.role, entry.title, entry.position, entry.company, entry.duration, entry.years, entry.summary, entry.description]
    .filter(Boolean)
    .join(' ')
}

const buildCvCorpus = (cv = {}) => {
  const skillList = toStringList(cv.skills)
  const experienceList = Array.isArray(cv.experience) ? cv.experience.map(formatExperienceEntry) : []
  const educationList = Array.isArray(cv.education)
    ? cv.education.map((item) => (typeof item === 'string' ? item : [item?.degree, item?.major, item?.school, item?.institution].filter(Boolean).join(' ')))
    : []
  const certificateList = toStringList(cv.certificates)
  const projectList = Array.isArray(cv.projects)
    ? cv.projects.map((item) => (typeof item === 'string' ? item : [item?.name, item?.title, item?.description, ...(Array.isArray(item?.technologies) ? item.technologies : [])].filter(Boolean).join(' ')))
    : []

  const skillKeys = skillList.map(normalizedKey).filter(Boolean)
  const combinedRaw = [
    cv.headline,
    ...skillList,
    ...experienceList,
    ...educationList,
    ...certificateList,
    ...projectList,
  ].filter(Boolean).join(' | ')

  const corpusKey = ` ${normalizedKey(combinedRaw)} `
  const corpusTokens = new Set(tokenize(combinedRaw))

  return {
    skillList,
    skillKeySet: new Set(skillKeys),
    skillKeys,
    corpusKey,
    corpusTokens,
    headlineKey: normalizedKey(cv.headline),
    experienceCount: experienceList.filter(Boolean).length,
    educationCount: educationList.filter(Boolean).length,
    rawCombined: combinedRaw,
  }
}

const hasPhraseInCorpus = (phrase, cvCorpus) => {
  const key = normalizedKey(phrase)
  if (!key) return false
  if (cvCorpus.skillKeySet.has(key)) return true
  if (cvCorpus.skillKeys.some((skillKey) => skillKey.includes(` ${key} `) || ` ${skillKey} `.includes(` ${key} `) || skillKey === key)) {
    return true
  }
  return cvCorpus.corpusKey.includes(` ${key} `)
}

const evaluateSkill = (skill, cvCorpus) => {
  if (hasPhraseInCorpus(skill, cvCorpus)) return 'met'
  const tokens = tokenize(skill)
  if (tokens.length >= 2) {
    const hits = tokens.filter((token) => cvCorpus.corpusTokens.has(token)).length
    if (hits === tokens.length) return 'met'
    if (hits / tokens.length >= 0.5) return 'partial'
  }
  return 'missing'
}

const extractRequiredYears = (text) => {
  const normalized = normalizeText(text)
  const match = normalized.match(/(\d+)\s*\+?\s*(nam|year|years|yr|yrs)/)
  return match ? Number(match[1]) : null
}

const evaluateRequirement = (requirement, cvCorpus) => {
  if (hasPhraseInCorpus(requirement, cvCorpus)) return 'met'

  const requiredYears = extractRequiredYears(requirement)
  if (requiredYears !== null && cvCorpus.experienceCount === 0 && !/\d+/.test(normalizeText(cvCorpus.rawCombined))) {
    return 'missing'
  }

  const tokens = tokenize(requirement)
  if (!tokens.length) return 'missing'

  const hits = tokens.filter((token) => cvCorpus.corpusTokens.has(token)).length
  const ratio = hits / tokens.length
  if (ratio >= 0.65 || (tokens.length <= 3 && hits >= 2)) return 'met'
  if (ratio >= 0.35 || hits >= 2) return 'partial'
  return 'missing'
}

const pickLatestCompleted = (records = []) => {
  if (!Array.isArray(records) || !records.length) return null
  return [...records]
    .filter((item) => item && item.status === 'COMPLETED')
    .sort((a, b) => (Number(b.analysisVersion || 0) - Number(a.analysisVersion || 0)) || (Number(b.id || 0) - Number(a.id || 0)))[0] || null
}

const isFreshComparison = (comparison, cv, jdAnalysis) => {
  if (!comparison || comparison.status !== 'COMPLETED') return false
  if (Number(comparison.cvAnalysisVersion) !== Number(cv?.analysisVersion || 0)) return false
  if (jdAnalysis && Number(comparison.jobJdAnalysisId) !== Number(jdAnalysis.id)) return false
  return true
}

const pickMatchingComparison = (comparisons = [], cv, jdAnalysis) => {
  if (!Array.isArray(comparisons) || !comparisons.length) return null
  return [...comparisons]
    .filter((item) => isFreshComparison(item, cv, jdAnalysis))
    .sort((a, b) => (Number(b.id || 0) - Number(a.id || 0)))[0] || null
}

const isJobActiveForRecommendation = (job, referenceDate = todayIso()) => {
  if (!job) return false
  if (job.status !== 'ACTIVE' || !job.isPublic || job.isHidden) return false
  if (!job.deadline || String(job.deadline).slice(0, 10) < referenceDate) return false
  if (job.category && (job.category.active === false || job.category.isActive === false)) return false
  return true
}

const getMatchTier = (score) => {
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

const scoreJobForCv = ({ cv, job, jdAnalysis = null, comparison = null, referenceDate = todayIso(), skipActiveCheck = false }) => {
  if (!skipActiveCheck && !isJobActiveForRecommendation(job, referenceDate)) return null

  const cvCorpus = buildCvCorpus(cv)
  const requiredSkillList = toStringList([
    ...(jdAnalysis?.requiredSkills || []),
    ...(Array.isArray(job.skills) ? job.skills : []),
  ])
  const requiredSkillKeys = new Set(requiredSkillList.map(normalizedKey))
  const preferredSkillList = toStringList(jdAnalysis?.preferredSkills || [])
    .filter((item) => !requiredSkillKeys.has(normalizedKey(item)))

  const allSkills = [...requiredSkillList, ...preferredSkillList]
  const directMatchedSkills = []
  const missingSkillItems = []

  allSkills.forEach((skill) => {
    const status = evaluateSkill(skill, cvCorpus)
    if (status === 'met') directMatchedSkills.push(skill)
    else missingSkillItems.push({ text: skill, isRequired: requiredSkillKeys.has(normalizedKey(skill)), status })
  })

  if (isFreshComparison(comparison, cv, jdAnalysis)) {
    const aiScore = calculateMatchScore(comparison)
    const metTextList = toStringList((comparison.metCriteria || []).map((item) => item?.criterion))
    const partialTextList = toStringList((comparison.partialCriteria || []).map((item) => item?.criterion))
    const missingTextList = toStringList((comparison.missingCriteria || []).map((item) => item?.criterion))

    const matchedSkills = toStringList([
      ...directMatchedSkills,
      ...metTextList.filter((item) => requiredSkillKeys.has(normalizedKey(item)) || preferredSkillList.some((s) => normalizedKey(s) === normalizedKey(item))),
    ])
    const matchedHighlights = matchedSkills.length ? matchedSkills : metTextList.slice(0, 6)
    const missingRequirements = missingTextList.length
      ? missingTextList
      : missingSkillItems.filter((item) => item.isRequired).map((item) => `Thiếu kỹ năng: ${item.text}`)

    const finalScore = typeof aiScore === 'number' ? aiScore : 0
    return {
      matchScore: finalScore,
      matchTier: getMatchTier(finalScore),
      scoreSource: 'ai_verified',
      matchedSkills: matchedHighlights.slice(0, 8),
      partialMatches: partialTextList.slice(0, 5),
      missingRequirements: missingRequirements.slice(0, 8),
      explanation: comparison.explanation || `Đã đối chiếu AI (${matchedHighlights.length} điểm phù hợp, ${missingRequirements.length} yêu cầu cần bổ sung).`,
      cvAnalysisVersion: Number(cv.analysisVersion || 0),
      jdAnalysisVersion: jdAnalysis ? Number(jdAnalysis.analysisVersion || 0) : null,
    }
  }

  const requirementPool = toStringList([
    ...(jdAnalysis?.mandatoryRequirements || []),
    ...(jdAnalysis?.experienceRequirements || []),
    ...(jdAnalysis?.educationRequirements || []),
    ...(Array.isArray(job.requirements) ? job.requirements : []),
    ...(jdAnalysis?.responsibilities || []).slice(0, 2),
  ]).filter((reqText) => !allSkills.some((skill) => normalizedKey(skill) === normalizedKey(reqText)))

  const metRequirements = []
  const partialMatches = []
  const missingRequirements = []

  requirementPool.forEach((reqText) => {
    const status = evaluateRequirement(reqText, cvCorpus)
    if (status === 'met') metRequirements.push(reqText)
    else if (status === 'partial') partialMatches.push(reqText)
    else missingRequirements.push(reqText)
  })

  // Track missing skills as missing requirements when not already covered by requirement text.
  const existingMissingKeys = new Set(missingRequirements.map(normalizedKey))
  missingSkillItems.forEach((item) => {
    const key = normalizedKey(item.text)
    if (item.status === 'partial') {
      if (!partialMatches.some((p) => normalizedKey(p) === key)) partialMatches.push(item.text)
      return
    }
    if (!existingMissingKeys.has(key) && item.isRequired) {
      missingRequirements.unshift(`Kỹ năng ${item.text}`)
      existingMissingKeys.add(key)
    }
  })
  if (!missingRequirements.length) {
    missingSkillItems
      .filter((item) => !item.isRequired && item.status === 'missing')
      .slice(0, 3)
      .forEach((item) => missingRequirements.push(`Kỹ năng ưu tiên: ${item.text}`))
  }

  // Weighted grounded score normalized across whichever sections the JD defines.
  let weightedEarned = 0
  let weightedTotal = 0

  if (requiredSkillList.length) {
    const reqMatched = requiredSkillList.filter((skill) => evaluateSkill(skill, cvCorpus) === 'met').length
    const reqPartial = requiredSkillList.filter((skill) => evaluateSkill(skill, cvCorpus) === 'partial').length
    weightedEarned += ((reqMatched + reqPartial * 0.5) / requiredSkillList.length) * 55
    weightedTotal += 55
  }
  if (preferredSkillList.length) {
    const prefMatched = preferredSkillList.filter((skill) => evaluateSkill(skill, cvCorpus) === 'met').length
    weightedEarned += (prefMatched / preferredSkillList.length) * 15
    weightedTotal += 15
  }
  if (requirementPool.length) {
    weightedEarned += ((metRequirements.length + partialMatches.length * 0.45) / requirementPool.length) * 25
    weightedTotal += 25
  }

  const titleTokens = tokenize(job.title)
  if (titleTokens.length) {
    const titleHits = titleTokens.filter((token) => cvCorpus.corpusTokens.has(token)).length
    weightedEarned += (titleHits / titleTokens.length) * 10
    weightedTotal += 10
  }

  let matchScore = weightedTotal > 0 ? Math.round((weightedEarned / weightedTotal) * 100) : 0
  if (directMatchedSkills.length === 0 && metRequirements.length === 0 && partialMatches.length === 0) {
    matchScore = Math.min(matchScore, 15)
  }
  matchScore = Math.max(0, Math.min(100, matchScore))

  const matchedSkills = directMatchedSkills.length
    ? directMatchedSkills
    : metRequirements.slice(0, 4)

  const explanationParts = []
  if (directMatchedSkills.length) explanationParts.push(`Khớp ${directMatchedSkills.length}/${allSkills.length || directMatchedSkills.length} kỹ năng JD (${directMatchedSkills.slice(0, 3).join(', ')})`)
  else explanationParts.push('Chưa thấy kỹ năng trọng tâm của JD trong CV hiện tại')
  if (missingRequirements.length) explanationParts.push(`còn ${missingRequirements.length} yêu cầu cần bổ sung`)

  return {
    matchScore,
    matchTier: getMatchTier(matchScore),
    scoreSource: 'jd_matched',
    matchedSkills: matchedSkills.slice(0, 8),
    partialMatches: toStringList(partialMatches).slice(0, 5),
    missingRequirements: toStringList(missingRequirements).slice(0, 8),
    explanation: `${explanationParts.join('; ')}.`,
    cvAnalysisVersion: Number(cv.analysisVersion || 0),
    jdAnalysisVersion: jdAnalysis ? Number(jdAnalysis.analysisVersion || 0) : null,
  }
}

const serializeRecommendedCv = (cv) => ({
  id: cv.id,
  displayName: cv.displayName,
  originalName: cv.originalName,
  isDefault: Boolean(cv.isDefault),
  headline: cv.headline || null,
  skills: toStringList(cv.skills),
  extractionStatus: cv.extractionStatus,
  analysisVersion: Number(cv.analysisVersion || 0),
  analyzedAt: cv.analyzedAt || null,
})

const getCandidateJobRecommendations = async (userId, options = {}) => {
  const allUserCvs = await db.CandidateCv.findAll({
    where: { userId },
    order: [['isDefault', 'DESC'], ['analyzedAt', 'DESC'], ['id', 'DESC']],
  })

  const analyzedCvs = allUserCvs.filter(
    (cv) => ANALYZED_CV_STATUSES.includes(cv.extractionStatus) && Number(cv.analysisVersion || 0) >= 1,
  )

  const requestedCvId = options.cvId !== undefined && options.cvId !== null && options.cvId !== ''
    ? Number(options.cvId)
    : null

  if (requestedCvId !== null) {
    if (!Number.isInteger(requestedCvId) || requestedCvId <= 0) {
      throw new ApiError(400, 'CV được chọn không hợp lệ.', 'INVALID_CV_ID')
    }
    const ownCv = allUserCvs.find((cv) => Number(cv.id) === requestedCvId)
    if (!ownCv) {
      throw new ApiError(404, 'Không tìm thấy CV của bạn.', 'CV_NOT_FOUND')
    }
    if (!ANALYZED_CV_STATUSES.includes(ownCv.extractionStatus) || Number(ownCv.analysisVersion || 0) < 1) {
      throw new ApiError(400, 'CV này chưa hoàn tất phân tích. Vui lòng phân tích CV trước khi xem gợi ý.', 'CV_ANALYSIS_REQUIRED')
    }
  }

  if (!analyzedCvs.length) {
    return {
      selectedCv: null,
      analyzedCvs: [],
      recommendations: [],
      emptyReason: 'CV_ANALYSIS_REQUIRED',
      meta: {
        totalActiveJobs: 0,
        totalMatched: 0,
        aiVerifiedCount: 0,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  const selectedCv = requestedCvId
    ? analyzedCvs.find((cv) => Number(cv.id) === requestedCvId)
    : (analyzedCvs.find((cv) => cv.isDefault) || analyzedCvs[0])

  const today = todayIso()
  const [activeJobs, favoriteRows, applicationRows] = await Promise.all([
    db.Job.findAll({
      where: {
        status: 'ACTIVE',
        isPublic: true,
        isHidden: false,
        deadline: { [Op.gte]: today },
      },
      include: [
        { model: db.JobCategory, as: 'category', where: { active: true }, required: true },
        { model: db.JobJdAnalysis, as: 'jdAnalyses', where: { status: 'COMPLETED' }, required: false },
        {
          model: db.CvJobComparison,
          as: 'cvComparisons',
          where: { candidateCvId: selectedCv.id, status: 'COMPLETED' },
          required: false,
        },
      ],
      order: [['publishedAt', 'DESC'], ['id', 'DESC']],
    }),
    db.FavoriteJob.findAll({ where: { candidateId: userId }, attributes: ['jobId'] }),
    db.Application.findAll({ where: { candidateId: userId }, attributes: ['jobId', 'status'] }),
  ])

  const savedJobIds = new Set(favoriteRows.map((row) => Number(row.jobId)))
  const applicationByJobId = new Map(applicationRows.map((row) => [Number(row.jobId), row.status]))

  const ranked = activeJobs
    .map((job) => {
      const jdAnalysis = pickLatestCompleted(job.jdAnalyses)
      const comparison = pickMatchingComparison(job.cvComparisons, selectedCv, jdAnalysis)
      const scored = scoreJobForCv({ cv: selectedCv, job, jdAnalysis, comparison, referenceDate: today })
      if (!scored) return null
      const jobId = Number(job.id)
      const applicationStatus = applicationByJobId.get(jobId) || null
      return {
        ...scored,
        isSaved: savedJobIds.has(jobId),
        hasApplied: Boolean(applicationStatus),
        applicationStatus,
        job: serializeJob(job),
      }
    })
    .filter(Boolean)
    .sort((a, b) => (
      (b.matchScore - a.matchScore)
      || ((b.scoreSource === 'ai_verified' ? 1 : 0) - (a.scoreSource === 'ai_verified' ? 1 : 0))
      || (b.matchedSkills.length - a.matchedSkills.length)
      || (a.missingRequirements.length - b.missingRequirements.length)
      || (new Date(b.job.publishedAt || 0).getTime() - new Date(a.job.publishedAt || 0).getTime())
    ))
    .map((item, index) => ({ rank: index + 1, ...item }))

  const searchKey = normalizedKey(options.search)
  const minScore = Number.isFinite(Number(options.minScore)) ? Number(options.minScore) : 0
  const hideApplied = options.hideApplied === true || options.hideApplied === 'true'
  const limit = Number.isInteger(Number(options.limit)) && Number(options.limit) > 0 ? Number(options.limit) : null

  let filtered = ranked.filter((item) => {
    if (item.matchScore < minScore) return false
    if (hideApplied && item.hasApplied) return false
    if (searchKey) {
      const haystack = normalizedKey([
        item.job.title,
        item.job.company,
        item.job.location,
        ...(item.job.tags || []),
        ...item.matchedSkills,
      ].join(' '))
      if (!haystack.includes(searchKey)) return false
    }
    return true
  })

  if (limit) {
    filtered = filtered.slice(0, limit)
  }

  return {
    selectedCv: serializeRecommendedCv(selectedCv),
    analyzedCvs: analyzedCvs.map(serializeRecommendedCv),
    recommendations: filtered,
    emptyReason: filtered.length ? null : 'NO_MATCHING_JOBS',
    meta: {
      totalActiveJobs: ranked.length,
      totalMatched: filtered.length,
      aiVerifiedCount: ranked.filter((item) => item.scoreSource === 'ai_verified').length,
      updatedAt: new Date().toISOString(),
    },
  }
}

module.exports = {
  getCandidateJobRecommendations,
  isFreshComparison,
  isJobActiveForRecommendation,
  scoreJobForCv,
}
