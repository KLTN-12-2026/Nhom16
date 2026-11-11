const assert = require('node:assert/strict')

const { createOllamaCvAnalysisService } = require('../../../app/service/ai/ollama-cv-analysis.service')

describe('Ollama CV analysis service', () => {
  it('sends only CV content to local Ollama with a JSON schema', async () => {
    let requestUrl
    let request
    const fetchImpl = async (url, options) => {
      requestUrl = url
      request = JSON.parse(options.body)
      return {
        ok: true,
        json: async () => ({ message: { content: JSON.stringify({
          candidateName: 'Nguyễn Văn A', candidateEmail: 'a@example.com', candidatePhone: null,
          headline: 'Backend Developer', education: ['Đại học Duy Tân'], experience: ['Peacom'],
          skills: ['NodeJS'], certificates: [], projects: [],
        }) } }),
      }
    }
    const service = createOllamaCvAnalysisService({
      baseUrl: 'http://127.0.0.1:11434/', model: 'test-model', fetchImpl,
    })

    const result = await service.analyze('NỘI DUNG CV NỘI BỘ')

    assert.equal(result.candidateName, 'Nguyễn Văn A')
    assert.equal(requestUrl, 'http://127.0.0.1:11434/api/chat')
    assert.equal(request.model, 'test-model')
    assert.equal(request.stream, false)
    assert.equal(request.options.temperature, 0)
    assert.equal(request.tools, undefined)
    assert.equal(request.format.type, 'object')
    assert.match(request.messages[1].content, /NỘI DUNG CV NỘI BỘ/)
  })

  it('returns a clear error when local Ollama is unavailable', async () => {
    const service = createOllamaCvAnalysisService({
      fetchImpl: async () => { throw new Error('ECONNREFUSED') },
    })
    await assert.rejects(service.analyze('CV content'), (error) => error.code === 'OLLAMA_UNAVAILABLE')
  })
})
