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
  requestOllamaStructuredJson,
}

