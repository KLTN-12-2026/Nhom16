const { expect } = require('chai')

const { db } = require('../../../app/db')
const {
  getCandidateJobRecommendations,
  isFreshComparison,
  isJobActiveForRecommendation,
  scoreJobForCv,
} = require('../../../app/service/candidate/job-recommendation.service')

describe('Candidate job recommendations (PB18)', () => {
  const referenceDate = '2026-11-15'
  const baseCv = {
    id: 11,
    displayName: 'CV Frontend React',
    originalName: 'cv-frontend.pdf',
    isDefault: true,
    headline: 'Frontend Developer (React / TypeScript)',
    skills: ['React', 'TypeScript', 'JavaScript', 'SCSS', 'REST API'],
    experience: ['2 năm phát triển SPA bằng React và TypeScript tại công ty ABC'],
    education: ['Cử nhân Công nghệ thông tin'],
    certificates: [],
    projects: [{ name: 'Job Portal UI', description: 'Xây dựng giao diện React với Redux Toolkit' }],
    extractionStatus: 'completed',
    analysisVersion: 2,
    analyzedAt: '2026-11-14T10:00:00.000Z',
  }

  const buildJob = (overrides = {}) => ({
    id: 101,
    title: 'Frontend React Developer',
    companyName: 'TechNova JSC',
    location: 'TP. Hồ Chí Minh',
    salaryMin: 18000000,
    salaryMax: 28000000,
    workMode: 'HYBRID',
    experienceLevel: 'JUNIOR',
    employmentType: 'FULL_TIME',
    positionLevel: 'STAFF',
    deadline: '2026-12-30',
    status: 'ACTIVE',
    isPublic: true,
    isHidden: false,
    skills: ['React', 'TypeScript', 'GraphQL'],
    requirements: ['Kinh nghiệm 1 năm React và TypeScript', 'Biết sử dụng GraphQL'],
    benefits: ['Bảo hiểm đầy đủ'],
    description: 'Phát triển web app với React.',
    publishedAt: '2026-11-10T08:00:00.000Z',
    createdAt: '2026-11-10T08:00:00.000Z',
    category: { id: 1, code: 'IT', name: 'Công nghệ thông tin', shortName: 'IT', isActive: true },
    jdAnalyses: [],
    cvComparisons: [],
    ...overrides,
  })

  describe('Active job eligibility gating', () => {
    it('excludes closed, hidden, private, draft, expired, or inactive-category jobs', () => {
      expect(isJobActiveForRecommendation(buildJob(), referenceDate)).to.equal(true)
      expect(isJobActiveForRecommendation(buildJob({ status: 'CLOSED' }), referenceDate)).to.equal(false)
      expect(isJobActiveForRecommendation(buildJob({ status: 'DRAFT' }), referenceDate)).to.equal(false)
      expect(isJobActiveForRecommendation(buildJob({ isHidden: true }), referenceDate)).to.equal(false)
      expect(isJobActiveForRecommendation(buildJob({ isPublic: false }), referenceDate)).to.equal(false)
      expect(isJobActiveForRecommendation(buildJob({ deadline: '2026-11-14' }), referenceDate)).to.equal(false)
      expect(isJobActiveForRecommendation(buildJob({ category: { id: 2, isActive: false } }), referenceDate)).to.equal(false)
      expect(scoreJobForCv({ cv: baseCv, job: buildJob({ status: 'CLOSED' }), referenceDate })).to.equal(null)
    })
  })

  describe('Grounded scoring and version-aware AI comparison', () => {
    it('computes matchScore, matchedSkills, and missingRequirements from internal CV & JD data', () => {
      const jdAnalysis = {
        id: 501,
        analysisVersion: 3,
        status: 'COMPLETED',
        requiredSkills: ['React', 'TypeScript', 'GraphQL'],
        preferredSkills: ['Docker'],
        experienceRequirements: ['Kinh nghiệm 1 năm React và TypeScript'],
        educationRequirements: ['Tốt nghiệp Công nghệ thông tin'],
        mandatoryRequirements: ['Thành thạo React và REST API'],
        responsibilities: [],
      }

      const strongScore = scoreJobForCv({ cv: baseCv, job: buildJob(), jdAnalysis, referenceDate })
      expect(strongScore.scoreSource).to.equal('jd_matched')
      expect(strongScore.matchScore).to.be.at.least(55)
      expect(strongScore.matchedSkills).to.include.members(['React', 'TypeScript'])
      expect(strongScore.missingRequirements.some((item) => item.includes('GraphQL'))).to.equal(true)

      const unrelatedJob = buildJob({
        id: 202,
        title: 'Kế toán tổng hợp',
        skills: ['MISA', 'Khai báo thuế', 'Excel nâng cao'],
        requirements: ['Chứng chỉ kế toán trưởng', '2 năm quyết toán thuế doanh nghiệp'],
      })
      const weakScore = scoreJobForCv({ cv: baseCv, job: unrelatedJob, referenceDate })
      expect(weakScore.matchScore).to.be.below(20)
      expect(weakScore.matchedSkills).to.have.length(0)
      expect(strongScore.matchScore).to.be.above(weakScore.matchScore)
    })

    it('uses fresh CvJobComparison score and invalidates automatically when CV or JD version changes', () => {
      const jdAnalysis = { id: 501, analysisVersion: 1, status: 'COMPLETED', requiredSkills: ['React', 'Docker'] }
      const comparison = {
        id: 900,
        status: 'COMPLETED',
        cvAnalysisVersion: 2,
        jobJdAnalysisId: 501,
        metCriteria: [{ criterion: 'React' }, { criterion: 'TypeScript' }, { criterion: 'REST API' }],
        partialCriteria: [{ criterion: 'CI/CD' }],
        missingCriteria: [{ criterion: 'Docker' }],
        explanation: 'CV khớp tốt React và REST API, còn thiếu kinh nghiệm Docker.',
      }

      expect(isFreshComparison(comparison, baseCv, jdAnalysis)).to.equal(true)
      const aiScored = scoreJobForCv({ cv: baseCv, job: buildJob(), jdAnalysis, comparison, referenceDate })
      expect(aiScored.scoreSource).to.equal('ai_verified')
      expect(aiScored.matchScore).to.equal(70)
      expect(aiScored.missingRequirements).to.deep.equal(['Docker'])

      // CV updated (analysisVersion incremented) -> stale comparison ignored
      const updatedCv = { ...baseCv, analysisVersion: 3 }
      expect(isFreshComparison(comparison, updatedCv, jdAnalysis)).to.equal(false)
      const recomputedAfterCvChange = scoreJobForCv({ cv: updatedCv, job: buildJob(), jdAnalysis, comparison, referenceDate })
      expect(recomputedAfterCvChange.scoreSource).to.equal('jd_matched')

      // JD re-analyzed (new jobJdAnalysisId) -> stale comparison ignored
      const updatedJd = { ...jdAnalysis, id: 502, analysisVersion: 2 }
      expect(isFreshComparison(comparison, baseCv, updatedJd)).to.equal(false)
      const recomputedAfterJdChange = scoreJobForCv({ cv: baseCv, job: buildJob(), jdAnalysis: updatedJd, comparison, referenceDate })
      expect(recomputedAfterJdChange.scoreSource).to.equal('jd_matched')
    })
  })

  describe('getCandidateJobRecommendations service orchestration', () => {
    const modelKeys = ['CandidateCv', 'Job', 'FavoriteJob', 'Application']
    const originals = {}

    beforeEach(() => {
      modelKeys.forEach((key) => {
        originals[key] = db[key]
        if (!db[key]) {
          db[key] = {}
        } else {
          originals[`${key}.findAll`] = db[key].findAll
        }
      })
    })

    afterEach(() => {
      modelKeys.forEach((key) => {
        if (originals[key] === undefined) {
          delete db[key]
        } else if (originals[`${key}.findAll`]) {
          db[key].findAll = originals[`${key}.findAll`]
        }
      })
    })

    it('returns CV_ANALYSIS_REQUIRED empty state when candidate has no analyzed CV', async () => {
      db.CandidateCv.findAll = async () => [{ id: 1, extractionStatus: 'pending', analysisVersion: 0 }]

      const payload = await getCandidateJobRecommendations(7)
      expect(payload.selectedCv).to.equal(null)
      expect(payload.recommendations).to.deep.equal([])
      expect(payload.emptyReason).to.equal('CV_ANALYSIS_REQUIRED')
    })

    it('rejects explicitly selecting an unanalyzed CV', async () => {
      db.CandidateCv.findAll = async () => [{ id: 9, extractionStatus: 'failed', analysisVersion: 0 }]

      let caught = null
      try {
        await getCandidateJobRecommendations(7, { cvId: 9 })
      } catch (error) {
        caught = error
      }
      expect(caught).to.not.equal(null)
      expect(caught.code).to.equal('CV_ANALYSIS_REQUIRED')
    })

    it('ranks active jobs descending and includes saved/applied flags', async () => {
      db.CandidateCv.findAll = async () => [baseCv]
      db.Job.findAll = async () => [
        buildJob({
          id: 202,
          title: 'Kế toán trưởng',
          skills: ['MISA', 'Khai báo thuế'],
          requirements: ['Chứng chỉ kế toán trưởng'],
        }),
        buildJob({
          id: 101,
          title: 'Frontend React Engineer',
          skills: ['React', 'TypeScript', 'SCSS'],
          requirements: ['Thành thạo React và TypeScript'],
        }),
      ]
      db.FavoriteJob.findAll = async () => [{ jobId: 101 }]
      db.Application.findAll = async () => [{ jobId: 202, status: 'RECEIVED' }]

      const payload = await getCandidateJobRecommendations(7)
      expect(payload.selectedCv.id).to.equal(11)
      expect(payload.recommendations).to.have.length(2)
      expect(payload.recommendations[0].rank).to.equal(1)
      expect(payload.recommendations[0].job.id).to.equal(101)
      expect(payload.recommendations[0].isSaved).to.equal(true)
      expect(payload.recommendations[0].hasApplied).to.equal(false)
      expect(payload.recommendations[1].job.id).to.equal(202)
      expect(payload.recommendations[1].hasApplied).to.equal(true)
      expect(payload.recommendations[1].applicationStatus).to.equal('RECEIVED')
    })
  })
})
