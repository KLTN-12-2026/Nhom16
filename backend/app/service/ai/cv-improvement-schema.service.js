const { isTechnicalLabel, isVietnameseText } = require('./cv-quality-schema.service')

const WARNING_FIELDS = ['missingContacts', 'spellingOrExpression', 'missingSections']
const OUT_OF_SCOPE_MESSAGE = 'Câu hỏi này nằm ngoài phạm vi hỗ trợ của hệ thống.'

const RECRUITMENT_ANCHORS = /(?:cv|hồ\s*sơ|resume|tuyển\s*dụng|ứng\s*tuyển|ứng\s*viên|nhà\s*tuyển\s*dụng|việc\s*làm|công\s*việc|nghề\s*nghiệp|kỹ\s*năng|skills?|kinh\s*nghiệm|experience|học\s*vấn|education|dự\s*án|projects?|chứng\s*chỉ|certificates?|mục\s*tiêu|tóm\s*tắt|summary|objective|trình\s*bày|bố\s*cục|layout|format|chính\s*tả|văn\s*phong|ngắn\s*gọn|súc\s*tích|chuyên\s*nghiệp|chuẩn\s*ats|\bats\b|thành\s*tích|số\s*liệu|phỏng\s*vấn|interview|lương|salary|\bjd\b|mô\s*tả\s*công\s*việc|vị\s*trí|chức\s*danh|ngành|chuyên\s*ngành|gpa|thực\s*tập|intern|fresher|junior|senior|developer|lập\s*trình|backend|frontend|fullstack|tester|\bqa\b|\bba\b|designer|marketing|kế\s*toán|nhân\s*sự|devops|mobile|data|react|vue|angular|node\.?js|typescript|javascript|java\b|python|golang|docker|sql|mysql|figma|ui\/?ux|cải\s*thiện|viết\s*lại|chỉnh\s*sửa|tối\s*ưu|nổi\s*bật|nhấn\s*mạnh|bổ\s*sung|gợi\s*ý|đánh\s*giá|liên\s*hệ|github|linkedin|portfolio)/iu
const OFF_TOPIC_PATTERNS = /(?:thời\s*tiết|nắng\s*mưa|trời\s*mưa|nấu\s*ăn|công\s*thức\s*món|ăn\s*(?:gì|món|trưa|tối|sáng)|món\s*(?:ăn|ngon)|giải\s*phương\s*trình|đạo\s*hàm|tích\s*phân|chứng\s*khoán|crypto|bitcoin|xổ\s*số|lô\s*đề|bóng\s*đá|tỷ\s*số|cá\s*độ|kể\s*chuyện|thơ\s*ca|viết\s*thơ|tử\s*vi|phong\s*thủy|thuốc\s*chữa|du\s*lịch|giá\s*vàng|xem\s*phim|nghe\s*nhạc|chơi\s*game|bạn\s*là\s*ai|mấy\s*giờ|xin\s*chào|chào\s*bạn)/iu

const sectionAdviceSchema = (editDesc) => ({
  type: 'object',
  additionalProperties: false,
  required: ['reason', 'actionableEdit'],
  properties: {
    reason: { type: 'string', maxLength: 260, description: 'Lý do cần chỉnh sửa bằng tiếng Việt có dấu.' },
    actionableEdit: { type: 'string', maxLength: 420, description: editDesc },
  },
})

const cvImprovementSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isOutOfScope',
    'targetRole',
    'recommendedSkills',
    'objectiveRewrite',
    'experienceRewrites',
    'educationSuggestion',
    'presentationSuggestion',
    'warnings',
  ],
  properties: {
    isOutOfScope: {
      type: 'boolean',
      description: 'true nếu customRequest không liên quan tuyển dụng/CV; ngược lại false.',
    },
    targetRole: {
      type: 'string',
      maxLength: 160,
      description: 'Vị trí hoặc chuyên ngành định hướng bám sát nội dung CV.',
    },
    recommendedSkills: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['keyword', 'reason'],
        properties: {
          keyword: { type: 'string', maxLength: 80, description: 'Từ khóa kỹ năng chuyên môn nên bổ sung.' },
          reason: { type: 'string', maxLength: 260, description: 'Lý do nên bổ sung bằng tiếng Việt có dấu.' },
        },
      },
    },
    objectiveRewrite: {
      type: 'object',
      additionalProperties: false,
      required: ['currentStatus', 'suggestedText', 'rationale'],
      properties: {
        currentStatus: { type: 'string', maxLength: 240, description: 'Nhận xét ngắn phần tóm tắt/mục tiêu hiện tại bằng tiếng Việt.' },
        suggestedText: { type: 'string', maxLength: 600, description: 'Đoạn tóm tắt/mục tiêu nghề nghiệp viết lại chuyên nghiệp bằng tiếng Việt có dấu.' },
        rationale: { type: 'string', maxLength: 300, description: 'Lý do chỉnh sửa bằng tiếng Việt có dấu.' },
      },
    },
    experienceRewrites: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'improved', 'focusNote'],
        properties: {
          original: { type: 'string', maxLength: 300, description: 'Câu hoặc ý gốc trong CV cần viết lại.' },
          improved: { type: 'string', maxLength: 500, description: 'Cách viết lại chuyên nghiệp hơn bằng tiếng Việt có dấu.' },
          focusNote: { type: 'string', maxLength: 240, description: 'Lý do và trọng tâm chỉnh sửa bằng tiếng Việt có dấu.' },
        },
      },
    },
    educationSuggestion: sectionAdviceSchema('Hướng chỉnh sửa phần Học vấn cụ thể bằng tiếng Việt có dấu.'),
    presentationSuggestion: sectionAdviceSchema('Hướng chỉnh sửa phần Trình bày & Bố cục cụ thể bằng tiếng Việt có dấu.'),
    warnings: {
      type: 'object',
      additionalProperties: false,
      required: WARNING_FIELDS,
      properties: {
        missingContacts: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 200 } },
        spellingOrExpression: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 260 } },
        missingSections: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 220 } },
      },
    },
  },
}

const isRecruitmentScopeRequest = (customRequest) => {
  const normalized = String(customRequest || '').trim()
  if (!normalized) return true
  const hasAnchor = RECRUITMENT_ANCHORS.test(normalized)
  if (OFF_TOPIC_PATTERNS.test(normalized) && !hasAnchor) return false
  return hasAnchor
}

const cleanString = (value, maxLength, field) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Invalid CV improvement field: ${field}`)
  }
  return value.trim().slice(0, maxLength)
}

const normalizeSectionAdvice = (value, field) => {
  if (!value || typeof value !== 'object') {
    throw new TypeError(`Invalid CV improvement field: ${field}`)
  }
  return {
    reason: cleanString(value.reason, 260, `${field}.reason`),
    actionableEdit: cleanString(value.actionableEdit, 420, `${field}.actionableEdit`),
  }
}

const normalizeTextList = (value, maxItems, maxLength, field) => {
  if (!Array.isArray(value)) throw new TypeError(`Invalid CV improvement field: ${field}`)
  return [...new Set(value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean))].slice(0, maxItems)
}

const normalizeSkills = (value) => {
  if (!Array.isArray(value)) throw new TypeError('Invalid CV improvement field: recommendedSkills')
  const seen = new Set()
  const result = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    if (typeof item.keyword !== 'string' || typeof item.reason !== 'string') continue
    const keyword = item.keyword.trim().slice(0, 80)
    const reason = item.reason.trim().slice(0, 260)
    if (!keyword || !reason) continue
    const key = keyword.toLocaleLowerCase('vi')
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ keyword, reason })
    if (result.length >= 6) break
  }
  return result
}

const normalizeRewrites = (value) => {
  if (!Array.isArray(value)) throw new TypeError('Invalid CV improvement field: experienceRewrites')
  const result = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    if (typeof item.original !== 'string' || typeof item.improved !== 'string' || typeof item.focusNote !== 'string') continue
    const original = item.original.trim().slice(0, 300)
    const improved = item.improved.trim().slice(0, 500)
    const focusNote = item.focusNote.trim().slice(0, 240)
    if (!original || !improved || !focusNote) continue
    result.push({ original, improved, focusNote })
    if (result.length >= 4) break
  }
  return result
}

const validateCvImprovement = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Invalid CV improvement result')
  }
  if (value.isOutOfScope === true) {
    return {
      isOutOfScope: true,
      targetRole: '',
      recommendedSkills: [],
      objectiveRewrite: { currentStatus: '', suggestedText: '', rationale: '' },
      experienceRewrites: [],
      educationSuggestion: { reason: '', actionableEdit: '' },
      presentationSuggestion: { reason: '', actionableEdit: '' },
      warnings: { missingContacts: [], spellingOrExpression: [], missingSections: [] },
    }
  }
  if (!value.objectiveRewrite || typeof value.objectiveRewrite !== 'object') {
    throw new TypeError('Invalid CV improvement field: objectiveRewrite')
  }
  if (!value.warnings || typeof value.warnings !== 'object') {
    throw new TypeError('Invalid CV improvement field: warnings')
  }

  return {
    isOutOfScope: false,
    targetRole: cleanString(value.targetRole, 160, 'targetRole'),
    recommendedSkills: normalizeSkills(value.recommendedSkills),
    objectiveRewrite: {
      currentStatus: cleanString(value.objectiveRewrite.currentStatus, 240, 'objectiveRewrite.currentStatus'),
      suggestedText: cleanString(value.objectiveRewrite.suggestedText, 600, 'objectiveRewrite.suggestedText'),
      rationale: cleanString(value.objectiveRewrite.rationale, 300, 'objectiveRewrite.rationale'),
    },
    experienceRewrites: normalizeRewrites(value.experienceRewrites),
    educationSuggestion: normalizeSectionAdvice(value.educationSuggestion, 'educationSuggestion'),
    presentationSuggestion: normalizeSectionAdvice(value.presentationSuggestion, 'presentationSuggestion'),
    warnings: {
      missingContacts: normalizeTextList(value.warnings.missingContacts, 4, 200, 'warnings.missingContacts'),
      spellingOrExpression: normalizeTextList(value.warnings.spellingOrExpression, 5, 260, 'warnings.spellingOrExpression'),
      missingSections: normalizeTextList(value.warnings.missingSections, 5, 220, 'warnings.missingSections'),
    },
  }
}

const isVietnameseCvImprovement = (value) => {
  if (value?.isOutOfScope === true) return true
  if (!value?.objectiveRewrite || !value?.educationSuggestion || !value?.presentationSuggestion || !value?.warnings) {
    return false
  }
  if (!(isVietnameseText(value.targetRole) || isTechnicalLabel(value.targetRole))) return false

  const requiredVietnamese = [
    value.objectiveRewrite.currentStatus,
    value.objectiveRewrite.suggestedText,
    value.objectiveRewrite.rationale,
    value.educationSuggestion.reason,
    value.educationSuggestion.actionableEdit,
    value.presentationSuggestion.reason,
    value.presentationSuggestion.actionableEdit,
    ...(value.recommendedSkills || []).map((item) => item.reason),
    ...(value.experienceRewrites || []).flatMap((item) => [item.improved, item.focusNote]),
  ]
  if (!requiredVietnamese.every(isVietnameseText)) return false

  const warningTexts = WARNING_FIELDS.flatMap((field) => (Array.isArray(value.warnings[field]) ? value.warnings[field] : []))
  return warningTexts.every((text) => isVietnameseText(text) || isTechnicalLabel(text))
}

module.exports = {
  OUT_OF_SCOPE_MESSAGE,
  cvImprovementSchema,
  isRecruitmentScopeRequest,
  isVietnameseCvImprovement,
  validateCvImprovement,
}
