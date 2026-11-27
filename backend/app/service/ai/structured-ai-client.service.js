const { ApiError } = require('../../util')

const requestOllamaStructuredJson = async ({
  baseUrl,
  model,
  timeoutMs,
  numPredict,
  format,
  schema,
  messages,
  fetchImpl = global.fetch,
  unavailableError,
}) => {
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        stream: false,
        keep_alive: '30m',
        format: format || schema,
        options: { temperature: 0, ...(numPredict ? { num_predict: numPredict } : {}) },
        messages,
      }),
    })
    if (!response.ok) throw new Error(`Ollama ${response.status}`)
    const payload = await response.json()
    if (!payload.message?.content) throw new Error('Ollama returned no structured content')
    return payload.message.content
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(503, unavailableError.message, unavailableError.code)
  }
}

const geminiAttemptTimeoutMs = 45000
const retryableGeminiStatuses = new Set([429, 500, 503])
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

// messages dạng { role: 'system' | 'user' | 'assistant', content } (cùng định dạng với Ollama).
const buildGeminiBody = ({ messages, schema, maxOutputTokens, legacySchemaFormat }) => {
  const system = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n')
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }))
  const generationConfig = { temperature: 0, maxOutputTokens }
  if (legacySchemaFormat) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseJsonSchema = schema
  } else {
    generationConfig.responseFormat = { text: { mimeType: 'APPLICATION_JSON', schema } }
  }
  return { ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}), contents, generationConfig }
}

const requestGeminiStructuredJson = async ({
  apiKey,
  model,
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
  timeoutMs,
  numPredict,
  schema,
  messages,
  fetchImpl = global.fetch,
  unavailableError,
  notConfiguredMessage = 'Dịch vụ AI chưa được cấu hình.',
  retryDelayMs = 2000,
}) => {
  if (!apiKey) throw new ApiError(503, notConfiguredMessage, 'AI_NOT_CONFIGURED')
  // maxOutputTokens của Gemini có thể gồm cả token "suy nghĩ", nên để dư so với số token JSON dự kiến.
  const maxOutputTokens = Math.max((Number(numPredict) || 1024) * 4, 4096)
  const url = `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`
  const post = (legacySchemaFormat) => fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    // Model Gemini đôi khi treo khi quá tải: giới hạn mỗi lượt để người dùng không phải chờ nhiều phút.
    signal: AbortSignal.timeout(Math.min(timeoutMs, geminiAttemptTimeoutMs)),
    body: JSON.stringify(buildGeminiBody({ messages, schema, maxOutputTokens, legacySchemaFormat })),
  })
  try {
    let response = await post(false)
    // Một số phiên bản API chỉ nhận định dạng schema cũ: thử lại một lần với định dạng đó.
    if (response.status === 400) response = await post(true)
    if (retryableGeminiStatuses.has(response.status)) {
      await sleep(retryDelayMs)
      response = await post(false)
    }
    if (!response.ok) throw new Error(`Gemini ${response.status}`)
    const payload = await response.json()
    const candidate = payload.candidates?.[0]
    if (candidate?.finishReason === 'MAX_TOKENS') throw new Error('Gemini output was truncated')
    const text = (candidate?.content?.parts || []).filter((part) => part.text && !part.thought).map((part) => part.text).join('')
    if (!text) throw new Error('Gemini returned no structured content')
    return text
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(503, unavailableError.message, unavailableError.code)
  }
}

const requestClaudeStructuredJson = async ({
  client,
  model,
  maxTokens,
  systemPrompt,
  messages,
  schema,
  notConfiguredMessage = 'Dịch vụ AI chưa được cấu hình.',
  unavailableError,
}) => {
  if (!client) throw new ApiError(503, notConfiguredMessage, 'AI_NOT_CONFIGURED')
  try {
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0,
      system: systemPrompt,
      messages,
      output_config: { format: { type: 'json_schema', schema } },
    })
    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock?.text) throw new Error('Claude returned no structured content')
    return textBlock.text
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(503, unavailableError.message, unavailableError.code)
  }
}

const executeWithVietnameseRetry = async ({
  initialMessages,
  runModel,
  validate,
  isVietnamese,
  buildTranslationMessages,
  invalidLanguageError,
}) => {
  let messages = initialMessages
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rawContent = await runModel(messages)
    const parsed = validate(JSON.parse(rawContent))
    if (isVietnamese(parsed)) return parsed
    messages = buildTranslationMessages(rawContent)
  }
  throw new ApiError(422, invalidLanguageError.message, invalidLanguageError.code)
}

module.exports = {
  executeWithVietnameseRetry,
  requestClaudeStructuredJson,
  requestGeminiStructuredJson,
  requestOllamaStructuredJson,
}

