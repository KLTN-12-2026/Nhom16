const { expect } = require('chai')

const { requestGeminiStructuredJson } = require('../../../app/service/ai/structured-ai-client.service')
const { createGeminiCvAnalysisService } = require('../../../app/service/ai/gemini-cv-analysis.service')
const { createCvQualityService, createGeminiQualityProvider } = require('../../../app/service/ai/cv-quality.service')

const geminiReply = (object, extra = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(object) }] }, ...extra }] }),
})
const failure = (status) => ({ ok: false, status, json: async () => ({}) })
const unavailableError = { message: 'AI lỗi', code: 'TEST_AI_UNAVAILABLE' }

describe('Gemini structured JSON client', () => {
  const base = { apiKey: 'test-key', model: 'gemini-test', timeoutMs: 1000, schema: { type: 'object' }, retryDelayMs: 0, unavailableError }

  it('sends the key in a header, splits the system prompt and returns the JSON text', async () => {
    const calls = []
    const fetchImpl = async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return geminiReply({ ok: true }) }
    const text = await requestGeminiStructuredJson({
      ...base, fetchImpl, baseUrl: 'https://example.test/v1beta/',
      messages: [{ role: 'system', content: 'SYS' }, { role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }],
    })
    expect(JSON.parse(text)).to.deep.equal({ ok: true })
    expect(calls[0].url).to.equal('https://example.test/v1beta/models/gemini-test:generateContent')
    expect(calls[0].url).to.not.include('test-key')
    expect(calls[0].init.headers['x-goog-api-key']).to.equal('test-key')
    expect(calls[0].body.systemInstruction.parts[0].text).to.equal('SYS')
    expect(calls[0].body.contents.map(item => item.role)).to.deep.equal(['user', 'model'])
    expect(calls[0].body.generationConfig.temperature).to.equal(0)
  })

  it('falls back to the legacy schema fields when the API rejects the new format with 400', async () => {
    const bodies = []
    const fetchImpl = async (url, init) => {
      bodies.push(JSON.parse(init.body).generationConfig)
      return bodies.length === 1 ? failure(400) : geminiReply({ ok: true })
    }
    await requestGeminiStructuredJson({ ...base, fetchImpl, messages: [{ role: 'user', content: 'x' }] })
    expect(bodies[0]).to.have.property('responseFormat')
    expect(bodies[1]).to.include({ responseMimeType: 'application/json' })
    expect(bodies[1]).to.have.property('responseJsonSchema')
  })

  it('retries once on rate limit (429) and then succeeds', async () => {
    let count = 0
    const fetchImpl = async () => { count += 1; return count === 1 ? failure(429) : geminiReply({ ok: true }) }
    await requestGeminiStructuredJson({ ...base, fetchImpl, messages: [{ role: 'user', content: 'x' }] })
    expect(count).to.equal(2)
  })

  it('maps persistent failures, truncation and missing keys to stable ApiErrors', async () => {
    const run = (overrides) => requestGeminiStructuredJson({ ...base, messages: [{ role: 'user', content: 'x' }], ...overrides })
    const rateLimited = await run({ fetchImpl: async () => failure(429) }).catch(error => error)
    expect(rateLimited.code).to.equal('TEST_AI_UNAVAILABLE')
    const truncated = await run({ fetchImpl: async () => geminiReply({ a: 1 }, { finishReason: 'MAX_TOKENS' }) }).catch(error => error)
    expect(truncated.code).to.equal('TEST_AI_UNAVAILABLE')
    const noKey = await run({ apiKey: '', fetchImpl: async () => geminiReply({}) }).catch(error => error)
    expect(noKey.code).to.equal('AI_NOT_CONFIGURED')
  })
})

describe('Gemini providers for CV features', () => {
  it('analyzes CV text and validates the structured result', async () => {
    let sentBody
    const service = createGeminiCvAnalysisService({
      apiKey: 'k', model: 'm',
      fetchImpl: async (url, init) => { sentBody = JSON.parse(init.body); return geminiReply({ fullName: 'A', headline: null, summary: null, skills: ['Node.js'], education: [], experience: [], projects: [], certificates: [] }) },
    })
    const result = await service.analyze('CV text Node.js')
    expect(JSON.stringify(result)).to.include('Node.js')
    expect(sentBody.contents[0].parts[0].text).to.include('<cv_content>')
  })

  it('rejects empty CV text without calling Gemini', async () => {
    const service = createGeminiCvAnalysisService({ apiKey: 'k', fetchImpl: async () => { throw new Error('must not be called') } })
    const error = await service.analyze('   ').catch(item => item)
    expect(error.code).to.equal('CV_TEXT_EMPTY')
  })

  it('is selectable as a provider and reports unconfigured Gemini clearly', async () => {
    const service = createCvQualityService({ provider: 'gemini', providers: { gemini: createGeminiQualityProvider({ apiKey: '', fetchImpl: async () => geminiReply({}) }) } })
    const error = await service.assess({ skills: ['Node.js'] }).catch(item => item)
    expect(error.code).to.equal('AI_NOT_CONFIGURED')
  })
})
