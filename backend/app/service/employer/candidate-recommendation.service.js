const { Op } = require('sequelize')

const { db } = require('../../db')
const { ApiError } = require('../../util')
const { isFreshComparison, scoreJobForCv } = require('../candidate/job-recommendation.service')
const { serializeJob } = require('../job/job.service')

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const toSafeArray = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [])

const pickLatestCompletedJd = (analyses = []) => {
  if (!Array.isArray(analyses) || !analyses.length) return null
  return [...analyses]
    .filter((item) => item && item.status === 'COMPLETED')
    .sort((a, b) => (Number(b.analysisVersion || 0) - Number(a.analysisVersion || 0)) || (Number(b.id || 0) - Number(a.id || 0)))[0] || null
}

const buildEffectiveCandidateCv = (cv = {}, candidateProfile = null) => {
  const cvJson = typeof cv?.toJSON === 'function' ? cv.toJSON() : (cv || {})
  const profileJson = typeof candidateProfile?.toJSON === 'function' ? candidateProfile.toJSON() : (candidateProfile || {})

  const combinedSkills = [...new Set([...toSafeArray(cvJson.skills), ...toSafeArray(profileJson.skills)])]
  return {
    id: Number(cvJson.id || 0),
    displayName: cvJson.displayName || 'CV ứng viên',
    originalName: cvJson.originalName || 'cv.pdf',
    headline: cvJson.headline || profileJson.title || null,
    skills: combinedSkills,
    experience: Array.isArray(cvJson.experience) && cvJson.experience.length
      ? cvJson.experience
      : (Array.isArray(profileJson.experience) ? profileJson.experience : []),
    education: Array.isArray(cvJson.education) && cvJson.education.length
      ? cvJson.education
      : (Array.isArray(profileJson.education) ? profileJson.education : []),
    certificates: Array.isArray(cvJson.certificates) ? cvJson.certificates : [],
    projects: Array.isArray(cvJson.projects) ? cvJson.projects : [],
    extractionStatus: cvJson.extractionStatus || 'pending',
    analysisVersion: Number(cvJson.analysisVersion || 0),
    analyzedAt: cvJson.analyzedAt || null,
  }
}

const sanitizeCandidateForEmployer = (candidate, effectiveCv) => {
  const userJson = typeof candidate?.toJSON === 'function' ? candidate.toJSON() : (candidate || {})
  const profileJson = userJson.candidateProfile || {}
  return {
    id: Number(userJson.id),
    fullName: userJson.fullName || 'Ứng viên',
    email: userJson.email || '',
    title: profileJson.title || effectiveCv.headline || 'Ứng viên tiềm năng',
    skills: effectiveCv.skills.slice(0, 12),
  }
}

const sanitizeCvForEmployer = (effectiveCv) => ({
  id: Number(effectiveCv.id),
  displayName: effectiveCv.displayName,
  originalName: effectiveCv.originalName,
  headline: effectiveCv.headline,
  skills: effectiveCv.skills.slice(0, 12),
  extractionStatus: effectiveCv.extractionStatus,
  analysisVersion: Number(effectiveCv.analysisVersion || 0),
  analyzedAt: effectiveCv.analyzedAt,
})

const scoreCandidateForJob = ({ application, job, jdAnalysis = null, comparison = null, isFavorite = false }) => {
  if (!application || !application.candidate || !application.cv || !job) return null

  const effectiveCv = buildEffectiveCandidateCv(application.cv, application.candidate.candidateProfile)
  const validComparison = isFreshComparison(comparison, effectiveCv, jdAnalysis) ? comparison : null
  const scored = scoreJobForCv({
    cv: effectiveCv,
    job,
    jdAnalysis,
    comparison: validComparison,
    skipActiveCheck: true,
  })
  if (!scored) return null

  const candidateData = sanitizeCandidateForEmployer(application.candidate, effectiveCv)
  const cvData = sanitizeCvForEmployer(effectiveCv)
  const appJob = application.job || job

  return {
    matchScore: scored.matchScore,
    matchTier: scored.matchTier,
    scoreSource: scored.scoreSource,
    matchedCriteria: scored.matchedSkills,
    partialCriteria: scored.partialMatches,
    missingCriteria: scored.missingRequirements,
    matchedSkills: scored.matchedSkills,
    missingRequirements: scored.missingRequirements,
    explanation: scored.explanation,
    cvAnalysisVersion: scored.cvAnalysisVersion,
    jdAnalysisVersion: scored.jdAnalysisVersion,
    isFavorite: Boolean(isFavorite),
    candidate: candidateData,
    cv: cvData,
    application: {
      id: Number(application.id),
      jobId: Number(application.jobId || appJob.id),
      jobTitle: appJob.title || job.title,
      status: application.status || 'RECEIVED',
      appliedAt: application.appliedAt,
      isDirectApplicant: Number(application.jobId || appJob.id) === Number(job.id),
      profileUrl: `/employer/applications?candidateId=${candidateData.id}`,
      cvDownloadUrl: `/api/employer/applications/${application.id}/cv/download`,
    },
  }
}

const serializeJobSummary = (job) => {
  const serialized = serializeJob(job)
  const latestJd = pickLatestCompletedJd(job.jdAnalyses)
  return {
    ...serialized,
    jdAnalysisVersion: latestJd ? Number(latestJd.analysisVersion || 0) : null,
    hasCompletedJdAnalysis: Boolean(latestJd),
  }
}

const getEmployerCandidateRecommendations = async (userId, options = {}) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) {
    throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')
  }

  const ownedJobs = await db.Job.findAll({
    where: { employerProfileId: profile.id },
    include: [
      { model: db.JobCategory, as: 'category' },
      { model: db.JobJdAnalysis, as: 'jdAnalyses', where: { status: 'COMPLETED' }, required: false },
    ],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  })

  const requestedJobId = options.jobId !== undefined && options.jobId !== null && options.jobId !== ''
    ? Number(options.jobId)
    : null

  if (requestedJobId !== null) {
    if (!Number.isInteger(requestedJobId) || requestedJobId <= 0) {
      throw new ApiError(400, 'Tin tuyển dụng được chọn không hợp lệ.', 'INVALID_JOB_ID')
    }
    const found = ownedJobs.find((job) => Number(job.id) === requestedJobId)
    if (!found) {
      throw new ApiError(404, 'Không tìm thấy tin tuyển dụng thuộc doanh nghiệp.', 'EMPLOYER_JOB_NOT_FOUND')
    }
  }

  if (!ownedJobs.length) {
    return {
      selectedJob: null,
      jobs: [],
      recommendations: [],
      emptyReason: 'NO_EMPLOYER_JOBS',
      meta: {
        pool: 'job',
        totalCandidates: 0,
        totalMatched: 0,
        highMatchCount: 0,
        aiVerifiedCount: 0,
        favoriteCount: 0,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  const selectedJob = requestedJobId
    ? ownedJobs.find((job) => Number(job.id) === requestedJobId)
    : (ownedJobs.find((job) => job.status === 'ACTIVE') || ownedJobs[0])

  const pool = options.pool === 'job' ? 'job' : 'employer'
  const jobWhere = pool === 'job'
    ? { id: selectedJob.id, employerProfileId: profile.id }
    : { employerProfileId: profile.id }

  const [applications, favoriteRows] = await Promise.all([
    db.Application.findAll({
      include: [
        { model: db.Job, as: 'job', where: jobWhere, required: true, attributes: ['id', 'title', 'employerProfileId'] },
        {
          model: db.User,
          as: 'candidate',
          required: true,
          attributes: ['id', 'fullName', 'email'],
          include: [
            {
              model: db.CandidateProfile,
              as: 'candidateProfile',
              required: false,
              attributes: ['title', 'skills', 'education', 'experience'],
            },
          ],
        },
        {
          model: db.CandidateCv,
          as: 'cv',
          required: true,
          attributes: [
            'id', 'displayName', 'originalName', 'headline', 'skills',
            'education', 'experience', 'certificates', 'projects',
            'extractionStatus', 'analysisVersion', 'analyzedAt',
          ],
        },
      ],
      order: [['appliedAt', 'DESC'], ['id', 'DESC']],
    }),
    db.FavoriteCandidate.findAll({ where: { employerId: userId }, attributes: ['candidateId'] }),
  ])

  // Deduplicate by candidateId: prefer direct application to selectedJob first, then most recent application
  const uniqueApplicationsByCandidate = new Map()
  applications.forEach((app) => {
    const candidateId = Number(app.candidate?.id || app.candidateId)
    if (!candidateId) return
    const existing = uniqueApplicationsByCandidate.get(candidateId)
    if (!existing) {
      uniqueApplicationsByCandidate.set(candidateId, app)
      return
    }
    const existingIsDirect = Number(existing.jobId) === Number(selectedJob.id)
    const currentIsDirect = Number(app.jobId) === Number(selectedJob.id)
    if (currentIsDirect && !existingIsDirect) {
      uniqueApplicationsByCandidate.set(candidateId, app)
    }
  })

  const deduplicatedApps = [...uniqueApplicationsByCandidate.values()]
  const cvIds = [...new Set(deduplicatedApps.map((app) => Number(app.cv?.id)).filter(Boolean))]

  const comparisons = cvIds.length
    ? await db.CvJobComparison.findAll({
      where: {
        jobId: selectedJob.id,
        candidateCvId: { [Op.in]: cvIds },
        status: 'COMPLETED',
      },
      order: [['id', 'DESC']],
    })
    : []

  const latestJdAnalysis = pickLatestCompletedJd(selectedJob.jdAnalyses)
  const comparisonByCvId = new Map()
  comparisons.forEach((comp) => {
    const cvId = Number(comp.candidateCvId)
    if (!comparisonByCvId.has(cvId)) {
      comparisonByCvId.set(cvId, comp)
    }
  })

  const favoriteCandidateIds = new Set(favoriteRows.map((row) => Number(row.candidateId)))

  const baseRanked = deduplicatedApps
    .map((application) => {
      const comparison = comparisonByCvId.get(Number(application.cv?.id)) || null
      return scoreCandidateForJob({
        application,
        job: selectedJob,
        jdAnalysis: latestJdAnalysis,
        comparison,
        isFavorite: favoriteCandidateIds.has(Number(application.candidate?.id)),
      })
    })
    .filter(Boolean)
    .sort((a, b) => (
      (b.matchScore - a.matchScore)
      || ((b.scoreSource === 'ai_verified' ? 1 : 0) - (a.scoreSource === 'ai_verified' ? 1 : 0))
      || (b.matchedCriteria.length - a.matchedCriteria.length)
      || (a.missingCriteria.length - b.missingCriteria.length)
      || (new Date(b.application.appliedAt || 0).getTime() - new Date(a.application.appliedAt || 0).getTime())
    ))
    .map((item, index) => ({ rank: index + 1, ...item }))

  const searchKey = normalizeText(options.search)
  const minScore = Number.isFinite(Number(options.minScore)) ? Number(options.minScore) : 0
  const statusFilter = options.status ? String(options.status).trim().toUpperCase() : ''
  const sortMode = options.sort ? String(options.sort).trim().toUpperCase() : 'SCORE_DESC'

  const filtered = baseRanked.filter((item) => {
    if (item.matchScore < minScore) return false
    if (statusFilter === 'FAVORITE' && !item.isFavorite) return false
    if (statusFilter && statusFilter !== 'FAVORITE' && item.application.status !== statusFilter) return false
    if (searchKey) {
      const haystack = normalizeText([
        item.candidate.fullName,
        item.candidate.email,
        item.candidate.title,
        item.cv.displayName,
        item.cv.headline,
        ...item.cv.skills,
        ...item.matchedCriteria,
      ].join(' '))
      if (!haystack.includes(searchKey)) return false
    }
    return true
  })

  filtered.sort((a, b) => {
    if (sortMode === 'SCORE_ASC') return (a.matchScore - b.matchScore) || (a.rank - b.rank)
    if (sortMode === 'MATCHED_DESC') return (b.matchedCriteria.length - a.matchedCriteria.length) || (b.matchScore - a.matchScore)
    if (sortMode === 'APPLIED_NEWEST') return new Date(b.application.appliedAt || 0).getTime() - new Date(a.application.appliedAt || 0).getTime()
    if (sortMode === 'NAME_ASC') return a.candidate.fullName.localeCompare(b.candidate.fullName, 'vi')
    return a.rank - b.rank
  })

  return {
    selectedJob: serializeJobSummary(selectedJob),
    jobs: ownedJobs.map(serializeJobSummary),
    recommendations: filtered,
    emptyReason: baseRanked.length === 0 ? 'NO_APPLICANTS' : (filtered.length === 0 ? 'NO_MATCHING_CANDIDATES' : null),
    meta: {
      pool,
      totalCandidates: baseRanked.length,
      totalMatched: filtered.length,
      highMatchCount: baseRanked.filter((item) => item.matchScore >= 70).length,
      aiVerifiedCount: baseRanked.filter((item) => item.scoreSource === 'ai_verified').length,
      favoriteCount: baseRanked.filter((item) => item.isFavorite).length,
      updatedAt: new Date().toISOString(),
    },
  }
}

module.exports = {
  buildEffectiveCandidateCv,
  getEmployerCandidateRecommendations,
  sanitizeCandidateForEmployer,
  sanitizeCvForEmployer,
  scoreCandidateForJob,
}
