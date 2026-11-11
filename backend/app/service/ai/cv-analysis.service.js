const { env } = require('../../config')
const { ApiError } = require('../../util')
const { createClaudeCvAnalysisService } = require('./claude-cv-analysis.service')
const { createOllamaCvAnalysisService } = require('./ollama-cv-analysis.service')

const createCvAnalysisService = ({ provider = env.ai.provider, services = {} } = {}) => {
  const providers = {
    ollama: services.ollama || createOllamaCvAnalysisService(),
    claude: services.claude || createClaudeCvAnalysisService(),
  }
  return {
    async analyze(cvText) {
      const service = providers[provider]
      if (!service) {
        throw new ApiError(500, `AI provider không được hỗ trợ: ${provider}`, 'AI_PROVIDER_NOT_SUPPORTED')
      }
      return service.analyze(cvText)
    },
  }
}

const cvAnalysisService = createCvAnalysisService()

module.exports = { createCvAnalysisService, cvAnalysisService }
