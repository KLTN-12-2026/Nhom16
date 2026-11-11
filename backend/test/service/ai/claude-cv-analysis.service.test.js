const assert = require('node:assert/strict')

const { createClaudeCvAnalysisService } = require('../../../app/service/ai/claude-cv-analysis.service')

describe('Claude CV analysis service', () => {
  it('sends only supplied CV content without enabling external tools', async () => {
    let request
    const client = { messages: { create: async (payload) => {
      request = payload
      return { content: [{ type: 'text', text: JSON.stringify({
        candidateName: 'Nguyễn Văn A', candidateEmail: 'a@example.com', candidatePhone: null,
        headline: 'Backend Developer', education: ['Đại học Duy Tân'], experience: ['Peacom'],
        skills: ['NodeJS'], certificates: [], projects: [],
      }) }] }
    } } }
    const service = createClaudeCvAnalysisService({ client, model: 'test-model', maxCharacters: 1000 })

    const result = await service.analyze('NỘI DUNG CV NỘI BỘ')

    assert.equal(result.candidateName, 'Nguyễn Văn A')
    assert.equal(request.model, 'test-model')
    assert.equal(request.tools, undefined)
    assert.match(request.messages[0].content, /NỘI DUNG CV NỘI BỘ/)
    assert.equal(request.output_config.format.type, 'json_schema')
  })

  it('returns a clear error when Claude is not configured', async () => {
    const service = createClaudeCvAnalysisService({ apiKey: '', client: null })
    await assert.rejects(service.analyze('CV content'), (error) => error.code === 'AI_NOT_CONFIGURED')
  })
})
