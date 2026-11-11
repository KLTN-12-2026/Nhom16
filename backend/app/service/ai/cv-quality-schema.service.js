const CRITERIA_FIELDS = ['completeness', 'clarity', 'consistency', 'evidence']

const VIETNAMESE_CHARACTERS = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i
const VIETNAMESE_WORDS = /\b(?:có|cần|chưa|được|hồ\s*sơ|kinh\s*nghiệm|kỹ\s*năng|năng\s*lực|nội\s*dung|thông\s*tin|trình\s*bày|dự\s*án|kết\s*quả|bổ\s*sung|rõ\s*ràng|nhất\s*quán)\b/i
const ENGLISH_NARRATIVE_WORDS = /\b(?:the|this|that|is|are|has|have|with|and|but|needs?|lacks?|provides?|contains?|shows?|experience|skills?|projects?|candidate)\b/gi

const isVietnameseText = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false
  return VIETNAMESE_CHARACTERS.test(value) || VIETNAMESE_WORDS.test(value)
}

const isTechnicalLabel = (value) => {
  if (typeof value !== 'string') return false
  const words = value.trim().split(/\s+/).filter(Boolean)
  const englishNarrativeWords = value.match(ENGLISH_NARRATIVE_WORDS) || []
  return words.length > 0 && words.length <= 8 && englishNarrativeWords.length <= 1
}

const criterionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'summary'],
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string', maxLength: 300, description: 'Nhận xét bằng tiếng Việt có dấu.' },
  },
}

const cvQualitySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['overallScore', 'criteria', 'strengths', 'limitations'],
  properties: {
    overallScore: { type: 'integer', minimum: 0, maximum: 100 },
    criteria: {
      type: 'object',
      additionalProperties: false,
      required: CRITERIA_FIELDS,
      properties: Object.fromEntries(CRITERIA_FIELDS.map((field) => [field, criterionSchema])),
    },
    strengths: { type: 'array', items: { type: 'string', description: 'Điểm mạnh bằng tiếng Việt có dấu.' }, maxItems: 6 },
    limitations: { type: 'array', items: { type: 'string', description: 'Điểm cần cải thiện bằng tiếng Việt có dấu.' }, maxItems: 6 },
  },
}

const normalizeScore = (value, field) => {
  const score = Number(value)
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new TypeError(`Invalid CV quality score: ${field}`)
  return score
}

const normalizeList = (value, field) => {
  if (!Array.isArray(value)) throw new TypeError(`Invalid CV quality field: ${field}`)
  return [...new Set(value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean))].slice(0, 6)
}

const validateCvQuality = (value) => {
  if (!value || typeof value !== 'object' || !value.criteria || typeof value.criteria !== 'object') {
    throw new TypeError('Invalid CV quality result')
  }
  const rawScores = [value.overallScore, ...CRITERIA_FIELDS.map((field) => value.criteria[field]?.score)].map(Number)
  const usesTenPointScale = rawScores.every((score) => Number.isFinite(score) && score >= 0 && score <= 10)
  const criteria = Object.fromEntries(CRITERIA_FIELDS.map((field) => {
    const criterion = value.criteria[field]
    if (!criterion || typeof criterion.summary !== 'string' || !criterion.summary.trim()) {
      throw new TypeError(`Invalid CV quality criterion: ${field}`)
    }
    const score = normalizeScore(criterion.score, field)
    return [field, { score: usesTenPointScale ? score * 10 : score, summary: criterion.summary.trim().slice(0, 300) }]
  }))
  return {
    overallScore: usesTenPointScale ? normalizeScore(value.overallScore, 'overallScore') * 10 : normalizeScore(value.overallScore, 'overallScore'),
    criteria,
    strengths: normalizeList(value.strengths, 'strengths'),
    limitations: normalizeList(value.limitations, 'limitations'),
  }
}

const isVietnameseCvQuality = (value) => {
  if (!value?.criteria) return false
  const summaries = CRITERIA_FIELDS.map((field) => value.criteria[field]?.summary)
  if (!summaries.every(isVietnameseText)) return false
  const insights = [
    ...(Array.isArray(value.strengths) ? value.strengths : []),
    ...(Array.isArray(value.limitations) ? value.limitations : []),
  ]
  return insights.every((text) => isVietnameseText(text) || isTechnicalLabel(text))
}

module.exports = { cvQualitySchema, isTechnicalLabel, isVietnameseCvQuality, isVietnameseText, validateCvQuality }
