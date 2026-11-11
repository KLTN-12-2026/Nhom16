const assert = require('node:assert/strict')

const { createCvAnalysisService } = require('../../../app/service/ai/cv-analysis.service')

describe('CV analysis provider service', () => {
  it('uses the configured provider only', async () => {
    const service = createCvAnalysisService({
      provider: 'ollama',
      services: {
        ollama: { analyze: async (text) => ({ provider: 'ollama', text }) },
        claude: { analyze: async () => { throw new Error('must not run') } },
      },
    })
    assert.deepEqual(await service.analyze('CV'), { provider: 'ollama', text: 'CV' })
  })

  it('rejects unsupported providers', async () => {
    const service = createCvAnalysisService({ provider: 'unknown' })
    await assert.rejects(service.analyze('CV'), (error) => error.code === 'AI_PROVIDER_NOT_SUPPORTED')
  })
})
