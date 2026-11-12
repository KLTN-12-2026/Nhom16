const { expect } = require('chai')

const {
  buildContactAudit,
  getCandidateCvImprovementStatus,
  mergeContactWarnings,
  processCandidateCvImprovement,
  suggestCandidateCvImprovement,
} = require('../../../app/service/candidate/cv-improvement-suggestion.service')

const validQualityAssessment = {
  id: 1,
  analysisVersion: 2,
  overallScore: 76,
  criteria: {
    completeness: { score: 75, summary: 'Có phần học vấn và kỹ năng.' },
    clarity: { score: 80, summary: 'Trình bày nhìn chung rõ ràng.' },
    consistency: { score: 78, summary: 'Thông tin khớp theo mốc thời gian.' },
    evidence: { score: 70, summary: 'Cần bổ sung số liệu kết quả dự án.' },
  },
  strengths: ['Kỹ năng liệt kê rõ ràng.'],
  limitations: ['Cần bổ sung số liệu đo lường trong kinh nghiệm.'],
  assessedAt: new Date('2026-11-11T10:00:00Z'),
}

const validAiOutput = {
  targetRole: 'Kỹ sư phần mềm Full-stack',
  recommendedSkills: [{ keyword: 'TypeScript', reason: 'Giúp kiểm soát kiểu dữ liệu an toàn hơn khi phát triển React.' }],
  objectiveRewrite: {
    currentStatus: 'Chưa có mục tiêu nghề nghiệp nổi bật.',
    suggestedText: 'Phát triển sản phẩm web chất lượng cao với React và Node.js, tối ưu trải nghiệm người dùng và hiệu năng API.',
    rationale: 'Bám sát kỹ năng hiện có và nêu rõ giá trị đóng góp.',
  },
  experienceRewrites: [],
  educationSuggestion: {
    reason: 'Phần học vấn cần thể hiện rõ chuyên ngành và đồ án liên quan.',
    actionableEdit: 'Bổ sung niên khóa, chuyên ngành Kỹ thuật phần mềm và tên đồ án tốt nghiệp.',
  },
  presentationSuggestion: {
    reason: 'Thứ tự mục rõ ràng giúp nhà tuyển dụng nắm bắt trọng tâm nhanh hơn.',
    actionableEdit: 'Sắp xếp theo thứ tự Tóm tắt -> Kỹ năng -> Kinh nghiệm -> Học vấn và căn lề đồng nhất.',
  },
  warnings: {
    missingContacts: ['Thiếu địa chỉ email liên hệ chuyên nghiệp.', 'Thiếu số điện thoại liên hệ trực tiếp.'],
    spellingOrExpression: [],
    missingSections: ['Nên bổ sung phần Chứng chỉ nếu có.'],
  },
}

describe('Candidate CV improvement suggestion service (PB12)', () => {
  it('requires CV quality assessment (PB11) before generating suggestions', async () => {
    const models = {
      CandidateCv: {
        findOne: async () => ({
          id: 5,
          userId: 10,
          extractionStatus: 'completed',
          analysisVersion: 2,
          candidateName: 'Nguyễn Văn An',
        }),
      },
      CvQualityAssessment: {
        findOne: async () => null,
      },
    }

    let capturedError
    try {
      await suggestCandidateCvImprovement(10, 5, { models })
    } catch (error) {
      capturedError = error
    }

    expect(capturedError.statusCode).to.equal(409)
    expect(capturedError.code).to.equal('CV_QUALITY_ASSESSMENT_REQUIRED')
  })

  it('rejects out-of-scope custom requests with exact required message before hitting DB or AI', async () => {
    let dbQueried = false
    let capturedError
    try {
      await suggestCandidateCvImprovement(10, 5, {
        customRequest: 'Hôm nay thời tiết Đà Nẵng thế nào?',
        models: {
          CandidateCv: {
            findOne: async () => {
              dbQueried = true
              return null
            },
          },
        },
      })
    } catch (error) {
      capturedError = error
    }

    expect(dbQueried).to.equal(false)
    expect(capturedError.statusCode).to.equal(422)
    expect(capturedError.message).to.equal('Câu hỏi này nằm ngoài phạm vi hỗ trợ của hệ thống.')
  })

  it('audits missing contacts deterministically and filters false contact warnings when email exists', () => {
    const cv = { candidateName: 'Trần Minh', candidateEmail: 'minh@example.com', candidatePhone: '' }
    const audit = buildContactAudit(cv)

    expect(audit.missingContactFields).to.deep.equal(['số điện thoại'])
    const merged = mergeContactWarnings(
      ['Thiếu email liên hệ.', 'số điện thoại', 'Nên bổ sung liên kết GitHub hoặc LinkedIn.'],
      audit,
    )

    expect(merged).to.deep.equal([
      'Thiếu số điện thoại liên hệ trực tiếp.',
      'Nên bổ sung liên kết GitHub hoặc LinkedIn.',
    ])
  })

  it('returns cached suggestion for current analysisVersion without calling AI again', async () => {
    let aiCalls = 0
    const cachedRecord = {
      id: 9,
      analysisVersion: 2,
      ...validAiOutput,
      generatedAt: new Date('2026-11-11T10:05:00Z'),
    }
    const models = {
      CandidateCv: {
        findOne: async () => ({ id: 5, userId: 10, extractionStatus: 'completed', analysisVersion: 2 }),
      },
      CvQualityAssessment: {
        findOne: async () => validQualityAssessment,
      },
      CvImprovementSuggestion: {
        findOne: async () => cachedRecord,
      },
    }

    const result = await suggestCandidateCvImprovement(10, 5, {
      models,
      improvementService: { suggest: async () => { aiCalls += 1; return validAiOutput } },
    })

    expect(aiCalls).to.equal(0)
    expect(result.id).to.equal(9)
    expect(result.educationSuggestion.actionableEdit).to.equal(validAiOutput.educationSuggestion.actionableEdit)
    expect(result.presentationSuggestion.reason).to.equal(validAiOutput.presentationSuggestion.reason)
  })

  it('saves normalized AI suggestions with deterministic contact audit when force is true', async () => {
    let savedValues
    const models = {
      CandidateCv: {
        findOne: async () => ({
          id: 5,
          userId: 10,
          extractionStatus: 'completed',
          analysisVersion: 2,
          candidateName: 'Lê Thị Hoa',
          candidateEmail: 'hoa@example.com',
          candidatePhone: null,
          headline: 'Frontend Developer',
          education: ['Đại học Duy Tân'],
          experience: [],
          skills: ['React', 'JavaScript'],
          certificates: [],
          projects: [],
        }),
      },
      CvQualityAssessment: {
        findOne: async () => validQualityAssessment,
      },
      CvImprovementSuggestion: {
        upsert: async (values) => {
          savedValues = values
          return [{ id: 12, ...values }]
        },
      },
    }

    const result = await suggestCandidateCvImprovement(10, 5, {
      force: true,
      models,
      improvementService: { suggest: async () => validAiOutput },
    })

    expect(savedValues.warnings.missingContacts).to.deep.equal(['Thiếu số điện thoại liên hệ trực tiếp.'])
    expect(savedValues.educationSuggestion).to.deep.equal(validAiOutput.educationSuggestion)
    expect(savedValues.presentationSuggestion).to.deep.equal(validAiOutput.presentationSuggestion)
    expect(result.id).to.equal(12)
    expect(result.disclaimer).to.include('AI')
  })

  it('enqueues improvement job into cvQueue and resolves worker status polling', async () => {
    let queuedPayload
    let savedValues
    const models = {
      CandidateCv: {
        findOne: async () => ({
          id: 5,
          userId: 10,
          extractionStatus: 'completed',
          analysisVersion: 2,
          candidateName: 'Lê Thị Hoa',
          candidateEmail: 'hoa@example.com',
          candidatePhone: '0905123456',
          headline: 'Frontend Developer',
          education: ['Đại học Duy Tân'],
          experience: [],
          skills: ['React'],
          certificates: [],
          projects: [],
        }),
      },
      CvQualityAssessment: {
        findOne: async () => validQualityAssessment,
      },
      CvImprovementSuggestion: {
        findOne: async () => null,
        upsert: async (values) => {
          savedValues = { id: 15, ...values }
          return [savedValues]
        },
      },
    }

    const cvQueue = {
      addImprovement: async (payload) => {
        queuedPayload = payload
        return { id: 'job-99' }
      },
      getJob: async (jobId) => ({
        id: jobId,
        data: queuedPayload,
        returnvalue: savedValues ? { id: 15, ...validAiOutput, analysisVersion: 2, generatedAt: savedValues.generatedAt, disclaimer: 'AI' } : null,
        getState: async () => (savedValues ? 'completed' : 'active'),
      }),
    }

    const queued = await suggestCandidateCvImprovement(10, 5, {
      force: true,
      customRequest: 'Nhấn mạnh React',
      cvQueue,
      models,
    })
    expect(queued).to.deep.equal({ status: 'queued', jobId: 'job-99', suggestion: null })
    expect(queuedPayload).to.deep.equal({
      userId: 10,
      cvId: 5,
      analysisVersion: 2,
      customRequest: 'Nhấn mạnh React',
    })

    const processingStatus = await getCandidateCvImprovementStatus(10, 5, 'job-99', { cvQueue, models })
    expect(processingStatus.status).to.equal('processing')

    const workerResult = await processCandidateCvImprovement(queuedPayload, {
      models,
      improvementService: { suggest: async () => validAiOutput },
    })
    expect(workerResult.id).to.equal(15)

    const completedStatus = await getCandidateCvImprovementStatus(10, 5, 'job-99', { cvQueue, models })
    expect(completedStatus.status).to.equal('completed')
    expect(completedStatus.suggestion.id).to.equal(15)
  })
})
