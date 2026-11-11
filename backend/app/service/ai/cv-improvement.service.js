const Anthropic = require('@anthropic-ai/sdk').default

const { env } = require('../../config')
const { ApiError } = require('../../util')
const {
  OUT_OF_SCOPE_MESSAGE,
  cvImprovementSchema,
  isRecruitmentScopeRequest,
  isVietnameseCvImprovement,
  validateCvImprovement,
} = require('./cv-improvement-schema.service')
const { executeWithVietnameseRetry, requestClaudeStructuredJson, requestOllamaStructuredJson } = require('./structured-ai-client.service')

const UNAVAILABLE_ERROR = {
  message: 'Hệ thống AI đang bận, vui lòng thử lại sau.',
  code: 'CV_IMPROVEMENT_AI_UNAVAILABLE',
}

const INVALID_LANGUAGE_ERROR = {
  message: 'AI chưa thể tạo gợi ý cải thiện bằng tiếng Việt. Vui lòng thử lại.',
  code: 'CV_IMPROVEMENT_LANGUAGE_INVALID',
}

const systemPrompt = `Bạn là chuyên gia tư vấn tối ưu CV của hệ thống tuyển dụng nội bộ.
Chỉ sử dụng dữ liệu nằm trong thẻ <cv_context>. Không dùng kiến thức về người thật, không truy cập web, không bịa đặt tên công ty, bằng cấp hoặc con số thành tích chưa có.
Nếu customRequest có nội dung không liên quan đến tuyển dụng, CV hoặc định hướng nghề nghiệp, đặt isOutOfScope = true. Ngược lại đặt isOutOfScope = false và đề xuất cải thiện chia đủ 5 phần:
1. objectiveRewrite (Tóm tắt / Mục tiêu nghề nghiệp): viết lại theo văn phong CV (bắt đầu trực tiếp bằng mục tiêu hoặc "Mong muốn...", không xưng "Ứng viên..."), chỉ dựa trên kỹ năng thực tế có trong CV (không gán kỹ năng chưa học từ recommendedSkills), kèm currentStatus và rationale.
2. experienceRewrites (Kinh nghiệm): chọn tối đa 4 dòng từ experience (hoặc projects nếu experience trống) để viết lại theo công thức Hành động + Công nghệ + Kết quả. Nếu thiếu số liệu thực tế, giữ placeholder [bổ sung số liệu thực tế] thay vì tự bịa, và không nói "đã bổ sung số liệu" nếu chưa có số liệu thật. Nếu cả experience và projects đều trống, trả về mảng rỗng.
3. recommendedSkills (Kỹ năng): gợi ý tối đa 6 từ khóa kỹ năng chuyên môn hoặc công cụ nên bổ sung cho đúng chuyên ngành (chưa xuất hiện rõ trong CV), kèm lý do ngắn gọn.
4. educationSuggestion (Học vấn): nêu reason (lý do cần tối ưu phần học vấn) và actionableEdit (hướng chỉnh sửa cụ thể, như bổ sung chuyên ngành, niên khóa, GPA nếu tốt hoặc đồ án liên quan).
5. presentationSuggestion (Trình bày): nêu reason (tác động của bố cục/cách trình bày) và actionableEdit (hướng chỉnh sửa bố cục, thứ tự mục, độ dài và nhất quán định dạng).
6. warnings:
   - missingContacts: chỉ ghi nhận các thông tin liên hệ khác ngoài họ tên/email/SĐT nếu thiếu (hoặc để mảng rỗng nếu missingContactFields rỗng).
   - spellingOrExpression: phát hiện và chỉ rõ các lỗi chính tả, viết tiếng Việt không dấu, viết hoa không nhất quán hoặc diễn đạt mờ nhạt thực sự có trong CV; nếu hoàn toàn chuẩn mực thì trả mảng rỗng.
   - missingSections: nêu các mục quan trọng đang trống hoặc thiếu thông tin.
BẮT BUỘC NGÔN NGỮ: Toàn bộ nội dung giải thích, gợi ý viết lại và cảnh báo phải viết bằng tiếng Việt tự nhiên, có dấu; chỉ giữ nguyên tên công nghệ hoặc thuật ngữ chuyên ngành khi cần. Trả đúng JSON Schema.`

const translationPrompt = `Bạn là dịch vụ chuẩn hóa ngôn ngữ cho gợi ý cải thiện CV.
Chỉ chuyển toàn bộ câu nhận xét, lý do, hướng chỉnh sửa, gợi ý viết lại và cảnh báo sang tiếng Việt tự nhiên có dấu.
Giữ nguyên cấu trúc JSON, tên công nghệ và thuật ngữ chuyên ngành cần thiết. Không thêm nội dung ngoài JSON.`

const normalizeInput = (cvData) => JSON.stringify({
  headline: cvData.headline || null,
  education: Array.isArray(cvData.education) ? cvData.education : [],
  experience: Array.isArray(cvData.experience) ? cvData.experience : [],
  skills: Array.isArray(cvData.skills) ? cvData.skills : [],
  certificates: Array.isArray(cvData.certificates) ? cvData.certificates : [],
  projects: Array.isArray(cvData.projects) ? cvData.projects : [],
  qualityLimitations: Array.isArray(cvData.qualityLimitations) ? cvData.qualityLimitations : [],
  missingContactFields: Array.isArray(cvData.missingContactFields) ? cvData.missingContactFields : [],
  customRequest: typeof cvData.customRequest === 'string' && cvData.customRequest.trim() ? cvData.customRequest.trim() : null,
})

const buildInitialUserMessage = (cvData) => ({
  role: 'user',
  content: `<cv_context>\n${normalizeInput(cvData)}\n</cv_context>\nHãy đề xuất cải thiện CV chia đủ 5 phần (tóm tắt, kinh nghiệm, kỹ năng, học vấn, trình bày) và viết TOÀN BỘ bằng tiếng Việt có dấu.`,
})

const buildTranslationMessages = (rawContent) => [
  { role: 'system', content: translationPrompt },
  { role: 'user', content: `<suggestions>\n${rawContent}\n</suggestions>\nHãy chuyển toàn bộ phần mô tả, gợi ý và cảnh báo sang tiếng Việt có dấu.` },
]

const ensureInScopeResult = (result) => {
  if (result.isOutOfScope) {
    throw new ApiError(422, OUT_OF_SCOPE_MESSAGE, 'OUT_OF_SCOPE_REQUEST')
  }
  return result
}

const createOllamaImprovementProvider = ({
  baseUrl = env.ai.ollamaBaseUrl,
  model = env.ai.ollamaModel,
  timeoutMs = env.ai.requestTimeoutMs,
  fetchImpl = global.fetch,
} = {}) => ({
  async suggest(cvData) {
    const result = await executeWithVietnameseRetry({
      initialMessages: [
        { role: 'system', content: systemPrompt },
        buildInitialUserMessage(cvData),
      ],
      runModel: (messages) => requestOllamaStructuredJson({
        baseUrl,
        model,
        timeoutMs,
        schema: cvImprovementSchema,
        messages,
        fetchImpl,
        unavailableError: UNAVAILABLE_ERROR,
      }),
      validate: validateCvImprovement,
      isVietnamese: isVietnameseCvImprovement,
      buildTranslationMessages,
      invalidLanguageError: INVALID_LANGUAGE_ERROR,
    })
    return ensureInScopeResult(result)
  },
})

const createClaudeImprovementProvider = ({
  apiKey = env.ai.anthropicApiKey,
  model = env.ai.anthropicModel,
  client = apiKey ? new Anthropic({ apiKey }) : null,
} = {}) => ({
  async suggest(cvData) {
    const result = await executeWithVietnameseRetry({
      initialMessages: [buildInitialUserMessage(cvData)],
      runModel: (messages) => requestClaudeStructuredJson({
        client,
        model,
        maxTokens: 2600,
        systemPrompt,
        messages,
        schema: cvImprovementSchema,
        unavailableError: UNAVAILABLE_ERROR,
      }),
      validate: validateCvImprovement,
      isVietnamese: isVietnameseCvImprovement,
      buildTranslationMessages: (rawContent) => [
        {
          role: 'user',
          content: `<suggestions>\n${rawContent}\n</suggestions>\nHãy chuyển toàn bộ phần mô tả, gợi ý và cảnh báo sang tiếng Việt có dấu, giữ nguyên JSON Schema.`,
        },
      ],
      invalidLanguageError: INVALID_LANGUAGE_ERROR,
    })
    return ensureInScopeResult(result)
  },
})

const createCvImprovementService = ({ provider = env.ai.provider, providers = {} } = {}) => {
  const availableProviders = {
    ollama: providers.ollama || createOllamaImprovementProvider(),
    claude: providers.claude || createClaudeImprovementProvider(),
  }
  return {
    async suggest(cvData) {
      if (!isRecruitmentScopeRequest(cvData?.customRequest)) {
        throw new ApiError(422, OUT_OF_SCOPE_MESSAGE, 'OUT_OF_SCOPE_REQUEST')
      }
      const selected = availableProviders[provider]
      if (!selected) {
        throw new ApiError(500, `AI provider không được hỗ trợ: ${provider}`, 'AI_PROVIDER_NOT_SUPPORTED')
      }
      return ensureInScopeResult(await selected.suggest(cvData))
    },
  }
}

const cvImprovementService = createCvImprovementService()

module.exports = {
  createClaudeImprovementProvider,
  createCvImprovementService,
  createOllamaImprovementProvider,
  cvImprovementService,
}
