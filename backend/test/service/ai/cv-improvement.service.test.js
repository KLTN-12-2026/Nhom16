const { expect } = require('chai')

const {
  createCvImprovementService,
  createOllamaImprovementProvider,
} = require('../../../app/service/ai/cv-improvement.service')
const {
  OUT_OF_SCOPE_MESSAGE,
  isRecruitmentScopeRequest,
  isVietnameseCvImprovement,
  validateCvImprovement,
} = require('../../../app/service/ai/cv-improvement-schema.service')

const validSuggestion = {
  isOutOfScope: false,
  targetRole: 'Lập trình viên Backend Node.js',
  recommendedSkills: [
    { keyword: 'Redis', reason: 'Hỗ trợ xử lý hàng đợi và lưu bộ nhớ đệm cho API.' },
    { keyword: 'Docker', reason: 'Giúp đóng gói và triển khai dịch vụ đồng nhất.' },
  ],
  objectiveRewrite: {
    currentStatus: 'Mục tiêu hiện tại còn chung chung và chưa nêu định hướng vị trí.',
    suggestedText: 'Ứng tuyển vị trí Backend Developer sử dụng Node.js và MySQL, hướng tới xây dựng API ổn định và tối ưu hiệu năng truy vấn.',
    rationale: 'Nêu rõ vị trí mục tiêu, công nghệ trọng tâm và giá trị đóng góp.',
  },
  experienceRewrites: [
    {
      original: 'Làm API cho website bán hàng.',
      improved: 'Thiết kế và xây dựng hệ thống RESTful API với Node.js và Express, phục vụ quy trình giỏ hàng và xử lý [số lượng thực tế] đơn hàng.',
      focusNote: 'Bổ sung động từ hành động, công nghệ sử dụng và kết quả đo lường.',
    },
  ],
  educationSuggestion: {
    reason: 'Nhà tuyển dụng cần thấy nhanh chuyên ngành và đồ án gắn với Backend.',
    actionableEdit: 'Nêu rõ chuyên ngành Công nghệ phần mềm, năm tốt nghiệp và 1–2 môn học hoặc đồ án về cơ sở dữ liệu.',
  },
  presentationSuggestion: {
    reason: 'Bố cục rõ giúp người đọc và hệ thống ATS quét được kỹ năng trọng tâm ngay đầu trang.',
    actionableEdit: 'Đưa phần Tóm tắt và Kỹ năng lên trên Kinh nghiệm/Dự án, giữ độ dài gọn trong 1–2 trang và thống nhất kiểu ngày tháng.',
  },
  warnings: {
    missingContacts: [],
    spellingOrExpression: ['Cụm từ "Làm API" diễn đạt còn sơ sài, nên nêu rõ vai trò và kết quả.'],
    missingSections: ['Chưa có phần Mục tiêu nghề nghiệp rõ ràng.'],
  },
}

describe('CV improvement AI service', () => {
  it('validates 5-section improvement payload and deduplicates keywords', () => {
    const result = validateCvImprovement({
      ...validSuggestion,
      recommendedSkills: [
        ...validSuggestion.recommendedSkills,
        { keyword: 'redis', reason: 'Trùng từ khóa cần loại bỏ.' },
      ],
    })
    expect(result.recommendedSkills).to.have.lengthOf(2)
    expect(result.educationSuggestion.actionableEdit).to.equal(validSuggestion.educationSuggestion.actionableEdit)
    expect(result.presentationSuggestion.reason).to.equal(validSuggestion.presentationSuggestion.reason)
    expect(() => validateCvImprovement({ ...validSuggestion, targetRole: '   ' })).to.throw('Invalid CV improvement field: targetRole')
  })

  it('rejects English-only responses while permitting tech terms inside Vietnamese suggestions', () => {
    expect(isVietnameseCvImprovement(validSuggestion)).to.equal(true)
    expect(isVietnameseCvImprovement({
      ...validSuggestion,
      educationSuggestion: {
        reason: 'Education section lacks graduation year.',
        actionableEdit: 'Add university major and graduation year.',
      },
      presentationSuggestion: {
        reason: 'Layout looks messy.',
        actionableEdit: 'Reorder sections cleanly.',
      },
    })).to.equal(false)
  })

  it('checks recruitment scope and rejects non-recruitment questions before or after LLM call', async () => {
    expect(isRecruitmentScopeRequest('')).to.equal(true)
    expect(isRecruitmentScopeRequest('Tối ưu CV theo hướng Backend Node.js')).to.equal(true)
    expect(isRecruitmentScopeRequest('Nhấn mạnh React và TypeScript')).to.equal(true)
    expect(isRecruitmentScopeRequest('Hôm nay thời tiết thế nào?')).to.equal(false)
    expect(isRecruitmentScopeRequest('Hôm nay ăn gì?')).to.equal(false)
    expect(isRecruitmentScopeRequest('Giải phương trình bậc 2 giúp tôi')).to.equal(false)

    let providerCalls = 0
    const service = createCvImprovementService({
      provider: 'ollama',
      providers: {
        ollama: {
          suggest: async () => {
            providerCalls += 1
            return { ...validSuggestion, isOutOfScope: true }
          },
        },
      },
    })

    let deterministicError
    try {
      await service.suggest({ headline: 'Backend Developer', customRequest: 'Chiều nay ăn món gì ngon?' })
    } catch (error) {
      deterministicError = error
    }
    expect(deterministicError.statusCode).to.equal(422)
    expect(deterministicError.message).to.equal(OUT_OF_SCOPE_MESSAGE)
    expect(providerCalls).to.equal(0)

    let semanticError
    try {
      await service.suggest({ headline: 'Backend Developer', customRequest: 'Viết lại CV thành bài thơ khen bóng đá' })
    } catch (error) {
      semanticError = error
    }
    expect(semanticError.statusCode).to.equal(422)
    expect(semanticError.message).to.equal(OUT_OF_SCOPE_MESSAGE)
    expect(providerCalls).to.equal(1)
  })

  it('excludes candidate PII from Ollama request and preserves temperature 0', async () => {
    let requestBody
    const provider = createOllamaImprovementProvider({
      baseUrl: 'http://ollama.local',
      model: 'test-model',
      fetchImpl: async (_url, options) => {
        requestBody = JSON.parse(options.body)
        return { ok: true, json: async () => ({ message: { content: JSON.stringify(validSuggestion) } }) }
      },
    })

    const result = await provider.suggest({
      candidateName: 'Nguyễn Văn Bí Mật',
      candidateEmail: 'secret@example.com',
      candidatePhone: '0987654321',
      headline: 'Backend Developer',
      skills: ['Node.js', 'MySQL'],
      experience: ['Làm API cho website bán hàng.'],
      qualityLimitations: ['Kinh nghiệm cần bổ sung kết quả đo lường.'],
      missingContactFields: ['email liên hệ'],
      customRequest: 'Nhấn mạnh kinh nghiệm API',
    })

    const userPrompt = requestBody.messages.find((item) => item.role === 'user').content
    expect(userPrompt).to.include('Backend Developer').and.include('email liên hệ').and.include('Nhấn mạnh kinh nghiệm API')
    expect(userPrompt).not.to.include('Nguyễn Văn Bí Mật')
      .and.not.to.include('secret@example.com')
      .and.not.to.include('0987654321')
    expect(requestBody.options.temperature).to.equal(0)
    expect(result.targetRole).to.equal(validSuggestion.targetRole)
  })

  it('retries Ollama once to translate when the first suggestion is in English', async () => {
    let calls = 0
    const englishSuggestion = {
      ...validSuggestion,
      recommendedSkills: [{ keyword: 'Docker', reason: 'Improves deployment consistency.' }],
      objectiveRewrite: {
        currentStatus: 'The career objective is missing.',
        suggestedText: 'Seeking a Backend Developer role focusing on Node.js APIs.',
        rationale: 'Adds clear direction for recruiters.',
      },
      experienceRewrites: [],
    }
    const provider = createOllamaImprovementProvider({
      baseUrl: 'http://ollama.local',
      model: 'test-model',
      fetchImpl: async () => {
        calls += 1
        return {
          ok: true,
          json: async () => ({ message: { content: JSON.stringify(calls === 1 ? englishSuggestion : validSuggestion) } }),
        }
      },
    })

    const result = await provider.suggest({ headline: 'Backend Developer', skills: ['Node.js'] })
    expect(calls).to.equal(2)
    expect(result.objectiveRewrite.suggestedText).to.equal(validSuggestion.objectiveRewrite.suggestedText)
  })

  it('returns the required Vietnamese busy error when AI service is unavailable', async () => {
    const provider = createOllamaImprovementProvider({
      baseUrl: 'http://ollama.local',
      model: 'test-model',
      fetchImpl: async () => { throw new Error('ECONNREFUSED') },
    })

    let capturedError
    try {
      await provider.suggest({ headline: 'Backend Developer' })
    } catch (error) {
      capturedError = error
    }

    expect(capturedError).to.exist
    expect(capturedError.statusCode).to.equal(503)
    expect(capturedError.code).to.equal('CV_IMPROVEMENT_AI_UNAVAILABLE')
    expect(capturedError.message).to.equal('Hệ thống AI đang bận, vui lòng thử lại sau.')
  })

  it('uses only the configured provider', async () => {
    let claudeCalls = 0
    const service = createCvImprovementService({
      provider: 'claude',
      providers: {
        ollama: { suggest: async () => { throw new Error('must not run') } },
        claude: { suggest: async () => { claudeCalls += 1; return validSuggestion } },
      },
    })

    await service.suggest({ headline: 'Frontend Developer' })
    expect(claudeCalls).to.equal(1)
  })
})
