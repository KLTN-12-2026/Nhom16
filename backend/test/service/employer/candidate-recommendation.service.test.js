const { expect } = require('chai')

const { db } = require('../../../app/db')
const {
  getEmployerCandidateRecommendations,
  sanitizeCandidateForEmployer,
  sanitizeCvForEmployer,
  scoreCandidateForJob,
} = require('../../../app/service/employer/candidate-recommendation.service')

describe('Employer candidate recommendations (PB19)', () => {
  const sampleJob = {
    id: 10,
    title: 'Backend Node.js Developer',
    company: 'TechNova JSC',
    location: 'TP. Hồ Chí Minh',
    salaryMin: 20000000,
    salaryMax: 35000000,
    workMode: 'HYBRID',
    experienceLevel: 'MIDDLE',
    employmentType: 'FULL_TIME',
    positionLevel: 'STAFF',
    deadline: '2026-12-30',
    status: 'ACTIVE',
    isPublic: true,
    isHidden: false,
    skills: ['Node.js', 'MySQL', 'Redis'],
    requirements: ['2 năm kinh nghiệm phát triển REST API với Node.js', 'Thành thạo MySQL và Redis'],
    benefits: ['Thưởng hiệu suất'],
    description: 'Xây dựng hệ thống backend chịu tải cao.',
    publishedAt: '2026-11-10T08:00:00.000Z',
    createdAt: '2026-11-10T08:00:00.000Z',
    category: { id: 1, code: 'IT', name: 'Công nghệ thông tin', shortName: 'IT', active: true },
    jdAnalyses: [
      {
        id: 701,
        analysisVersion: 2,
        status: 'COMPLETED',
        requiredSkills: ['Node.js', 'MySQL', 'Redis'],
        preferredSkills: ['Docker'],
        experienceRequirements: ['2 năm kinh nghiệm phát triển REST API với Node.js'],
        educationRequirements: ['Tốt nghiệp Công nghệ thông tin'],
        mandatoryRequirements: ['Thành thạo MySQL và Redis'],
        responsibilities: [],
      },
    ],
  }

  const buildApplication = (overrides = {}) => ({
    id: 301,
    jobId: 10,
    candidateId: 3,
    candidateCvId: 21,
    status: 'RECEIVED',
    appliedAt: '2026-11-14T09:00:00.000Z',
    job: { id: 10, title: 'Backend Node.js Developer', employerProfileId: 5 },
    candidate: {
      id: 3,
      fullName: 'Nguyễn Minh Quân',
      email: 'quan@example.com',
      passwordHash: 'secret-hash-never-expose',
      candidateProfile: {
        title: 'Backend Node.js Engineer',
        skills: ['Node.js', 'MySQL'],
        phone: '0901234567',
        address: 'Private Street 123',
      },
    },
    cv: {
      id: 21,
      displayName: 'CV_Nguyen_Minh_Quan',
      originalName: 'quan-backend.pdf',
      storedName: 'internal-uuid.pdf',
      storagePath: 'D:/secret/storage/internal-uuid.pdf',
      avatarPath: 'D:/secret/storage/avatar.png',
      headline: 'Backend Developer (Node.js / MySQL)',
      skills: ['Node.js', 'MySQL', 'REST API'],
      experience: ['3 năm phát triển REST API với Node.js và MySQL'],
      education: ['Cử nhân Công nghệ thông tin'],
      certificates: [],
      projects: [],
      extractionStatus: 'completed',
      analysisVersion: 1,
      analyzedAt: '2026-11-13T10:00:00.000Z',
    },
    ...overrides,
  })

  describe('Privacy & permission sanitization', () => {
    it('strips internal storage paths, password hashes, and private contact fields', () => {
      const app = buildApplication()
      const candidateOut = sanitizeCandidateForEmployer(app.candidate, app.cv)
      const cvOut = sanitizeCvForEmployer(app.cv)

      expect(candidateOut).to.not.have.property('passwordHash')
      expect(candidateOut).to.not.have.property('phone')
      expect(candidateOut).to.not.have.property('address')
      expect(cvOut).to.not.have.property('storagePath')
      expect(cvOut).to.not.have.property('storedName')
      expect(cvOut).to.not.have.property('avatarPath')
    })
  })

  describe('Candidate scoring and automatic version invalidation', () => {
    it('computes score, matchedCriteria, missingCriteria, and allowed profile links', () => {
      const app = buildApplication()
      const result = scoreCandidateForJob({
        application: app,
        job: sampleJob,
        jdAnalysis: sampleJob.jdAnalyses[0],
        isFavorite: true,
      })

      expect(result.matchScore).to.be.at.least(60)
      expect(result.matchedCriteria).to.include.members(['Node.js', 'MySQL'])
      expect(result.missingCriteria.some((item) => item.includes('Redis'))).to.equal(true)
      expect(result.isFavorite).to.equal(true)
      expect(result.application.profileUrl).to.equal('/employer/applications?candidateId=3')
      expect(result.application.cvDownloadUrl).to.equal('/api/employer/applications/301/cv/download')
    })

    it('uses fresh CvJobComparison and automatically recomputes when CV or JD version changes', () => {
      const app = buildApplication()
      const comparison = {
        id: 88,
        status: 'COMPLETED',
        cvAnalysisVersion: 1,
        jobJdAnalysisId: 701,
        metCriteria: [{ criterion: 'Node.js' }, { criterion: 'MySQL' }, { criterion: 'Redis' }],
        partialCriteria: [],
        missingCriteria: [{ criterion: 'Docker' }],
        explanation: 'Ứng viên đáp ứng đầy đủ kỹ năng Backend cốt lõi.',
      }

      const verified = scoreCandidateForJob({
        application: app,
        job: sampleJob,
        jdAnalysis: sampleJob.jdAnalyses[0],
        comparison,
      })
      expect(verified.scoreSource).to.equal('ai_verified')
      expect(verified.matchScore).to.equal(75)

      // When CV is re-analyzed (analysisVersion -> 2), stale comparison is ignored
      const updatedApp = buildApplication({
        cv: { ...app.cv, analysisVersion: 2 },
      })
      const recomputed = scoreCandidateForJob({
        application: updatedApp,
        job: sampleJob,
        jdAnalysis: sampleJob.jdAnalyses[0],
        comparison,
      })
      expect(recomputed.scoreSource).to.equal('jd_matched')
    })
  })

  describe('getEmployerCandidateRecommendations orchestration, filtering, and sorting', () => {
    const modelKeys = ['EmployerProfile', 'Job', 'Application', 'CvJobComparison', 'FavoriteCandidate']
    const originals = {}

    beforeEach(() => {
      modelKeys.forEach((key) => {
        originals[key] = db[key]
        if (!db[key]) {
          db[key] = {}
        } else {
          originals[`${key}.findOne`] = db[key].findOne
          originals[`${key}.findAll`] = db[key].findAll
        }
      })
    })

    afterEach(() => {
      modelKeys.forEach((key) => {
        if (originals[key] === undefined) {
          delete db[key]
        } else {
          if (originals[`${key}.findOne`]) db[key].findOne = originals[`${key}.findOne`]
          if (originals[`${key}.findAll`]) db[key].findAll = originals[`${key}.findAll`]
        }
      })
    })

    it('rejects accessing a jobId not owned by the employer', async () => {
      db.EmployerProfile.findOne = async () => ({ id: 5, userId: 2, companyName: 'TechNova JSC' })
      db.Job.findAll = async () => [sampleJob]

      let caught = null
      try {
        await getEmployerCandidateRecommendations(2, { jobId: 999 })
      } catch (error) {
        caught = error
      }
      expect(caught).to.not.equal(null)
      expect(caught.code).to.equal('EMPLOYER_JOB_NOT_FOUND')
    })

    it('ranks, filters, and sorts visible candidates for the selected job', async () => {
      db.EmployerProfile.findOne = async () => ({ id: 5, userId: 2, companyName: 'TechNova JSC' })
      db.Job.findAll = async () => [sampleJob]
      db.Application.findAll = async () => [
        buildApplication({
          id: 302,
          candidateId: 4,
          candidateCvId: 22,
          appliedAt: '2026-11-15T08:00:00.000Z',
          candidate: { id: 4, fullName: 'Trần Thu Hà', email: 'ha@example.com', candidateProfile: { title: 'Tester', skills: ['Manual Test'] } },
          cv: { id: 22, displayName: 'CV_Ha', originalName: 'ha.pdf', headline: 'QA Tester', skills: ['Manual Test'], experience: [], education: [], analysisVersion: 1 },
        }),
        buildApplication(),
      ]
      db.FavoriteCandidate.findAll = async () => [{ candidateId: 3 }]
      db.CvJobComparison.findAll = async () => []

      const ranked = await getEmployerCandidateRecommendations(2, { jobId: 10 })
      expect(ranked.recommendations).to.have.length(2)
      expect(ranked.recommendations[0].rank).to.equal(1)
      expect(ranked.recommendations[0].candidate.id).to.equal(3)
      expect(ranked.recommendations[0].isFavorite).to.equal(true)
      expect(ranked.recommendations[1].candidate.id).to.equal(4)

      // Filter by FAVORITE status
      const favoritesOnly = await getEmployerCandidateRecommendations(2, { jobId: 10, status: 'FAVORITE' })
      expect(favoritesOnly.recommendations).to.have.length(1)
      expect(favoritesOnly.recommendations[0].candidate.id).to.equal(3)

      // Sort by APPLIED_NEWEST
      const newestSorted = await getEmployerCandidateRecommendations(2, { jobId: 10, sort: 'APPLIED_NEWEST' })
      expect(newestSorted.recommendations[0].candidate.id).to.equal(4)
    })
  })
})

