const { expect } = require('chai')

const { createCvQualityService, createOllamaQualityProvider } = require('../../../app/service/ai/cv-quality.service')
const { isVietnameseCvQuality, validateCvQuality } = require('../../../app/service/ai/cv-quality-schema.service')

const validResult = {
  overallScore: 78,
  criteria: {
    completeness: { score: 80, summary: 'Có đủ các phần nghề nghiệp chính.' },
    clarity: { score: 75, summary: 'Nội dung nhìn chung dễ hiểu.' },
    consistency: { score: 82, summary: 'Thông tin nhất quán giữa các phần.' },
    evidence: { score: 74, summary: 'Một số dự án có bằng chứng kết quả.' },
  },
  strengths: ['Kỹ năng được trình bày rõ ràng.'],
  limitations: ['Kinh nghiệm cần bổ sung kết quả đo lường.'],
}

describe('CV quality assessment service', () => {
  it('validates the explainable score structure', () => {
    expect(validateCvQuality(validResult)).to.deep.equal(validResult)
    expect(() => validateCvQuality({ ...validResult, overallScore: 101 })).to.throw('Invalid CV quality score')
  })

  it('normalizes a model response using a 10-point scale to 100 points', () => {
    const normalized = validateCvQuality({
      ...validResult,
      overallScore: 8,
      criteria: Object.fromEntries(Object.entries(validResult.criteria).map(([key, criterion]) => [key, { ...criterion, score: 8 }])),
    })
    expect(normalized.overallScore).to.equal(80)
    expect(normalized.criteria.completeness.score).to.equal(80)
  })

  it('detects and rejects an English-only assessment language', () => {
    expect(isVietnameseCvQuality(validResult)).to.equal(true)
    expect(isVietnameseCvQuality({
      ...validResult,
      criteria: Object.fromEntries(Object.entries(validResult.criteria).map(([key, criterion]) => [key, { ...criterion, summary: 'The CV is clear and complete.' }])),
      strengths: ['The CV is well organized.'],
      limitations: ['The projects need more evidence.'],
    })).to.equal(false)
  })

  it('allows short technology and project names inside Vietnamese insights', () => {
    expect(isVietnameseCvQuality({
      ...validResult,
      strengths: ['React', 'Fashion website with integrated chatbot'],
      limitations: ['Cần bổ sung kết quả đo lường.'],
    })).to.equal(true)
  })

  it('sends only non-sensitive structured CV data to local Ollama', async () => {
    let request
    const provider = createOllamaQualityProvider({
      baseUrl: 'http://ollama.local',
      model: 'test-model',
      fetchImpl: async (_url, options) => {
        request = JSON.parse(options.body)
        return { ok: true, json: async () => ({ message: { content: JSON.stringify(validResult) } }) }
      },
    })
    const result = await provider.assess({
      candidateName: 'Sensitive Name',
      candidateEmail: 'sensitive@example.com',
      candidatePhone: '0123456789',
      headline: 'Backend Developer',
      skills: ['Node.js'],
      experience: ['Built an API'],
    })
    const userContent = request.messages.find((message) => message.role === 'user').content
    expect(userContent).to.include('Backend Developer').and.include('Node.js')
    expect(userContent).not.to.include('Sensitive Name').and.not.include('sensitive@example.com').and.not.include('0123456789')
    expect(request.options.temperature).to.equal(0)
    expect(result.overallScore).to.equal(78)
  })

  it('uses only the configured provider', async () => {
    let ollamaCalls = 0
    const service = createCvQualityService({
      provider: 'ollama',
      providers: {
        ollama: { assess: async () => { ollamaCalls += 1; return validResult } },
        claude: { assess: async () => { throw new Error('must not run') } },
      },
    })
    await service.assess({ skills: [] })
    expect(ollamaCalls).to.equal(1)
  })

  it('retries Ollama once when the first assessment is in English', async () => {
    let calls = 0
    const englishResult = {
      ...validResult,
      criteria: Object.fromEntries(Object.entries(validResult.criteria).map(([key, criterion]) => [key, { ...criterion, summary: 'The CV is clear and complete.' }])),
      strengths: ['The CV is well organized.'],
      limitations: ['The projects need more evidence.'],
    }
    const provider = createOllamaQualityProvider({
      baseUrl: 'http://ollama.local',
      model: 'test-model',
      fetchImpl: async (_url, options) => {
        calls += 1
        const request = JSON.parse(options.body)
        if (calls === 2) {
          expect(request.messages[0].content).to.include('chuẩn hóa ngôn ngữ')
          expect(request.messages.at(-1).content).to.include('dịch toàn bộ')
        }
        return { ok: true, json: async () => ({ message: { content: JSON.stringify(calls === 1 ? englishResult : validResult) } }) }
      },
    })
    const result = await provider.assess({ headline: 'Backend Developer' })
    expect(calls).to.equal(2)
    expect(result.criteria.clarity.summary).to.equal(validResult.criteria.clarity.summary)
  })
})
