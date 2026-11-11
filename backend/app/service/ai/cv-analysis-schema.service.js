const ANALYSIS_LIST_FIELDS = ['education', 'experience', 'skills', 'certificates', 'projects']
const ANALYSIS_TEXT_FIELDS = ['candidateName', 'candidateEmail', 'candidatePhone', 'headline']

const cvAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [...ANALYSIS_TEXT_FIELDS, ...ANALYSIS_LIST_FIELDS],
  properties: {
    candidateName: { type: ['string', 'null'], description: 'Họ và tên ứng viên, không phải tên dự án hoặc chức danh.' },
    candidateEmail: { type: ['string', 'null'], description: 'Địa chỉ email của ứng viên.' },
    candidatePhone: { type: ['string', 'null'], description: 'Số điện thoại của ứng viên.' },
    headline: { type: ['string', 'null'], description: 'Chức danh hoặc vị trí nghề nghiệp của ứng viên.' },
    education: { type: 'array', items: { type: 'string' }, maxItems: 16, description: 'Trường học, chuyên ngành, bằng cấp và thời gian học.' },
    experience: { type: 'array', items: { type: 'string' }, maxItems: 16, description: 'Kinh nghiệm làm việc tại công ty hoặc tổ chức; không gồm dự án cá nhân.' },
    skills: { type: 'array', items: { type: 'string' }, maxItems: 24, description: 'Kỹ năng, công nghệ, ngôn ngữ và công cụ.' },
    certificates: { type: 'array', items: { type: 'string' }, maxItems: 16, description: 'Chỉ chứng chỉ/chứng nhận thực sự như TOEIC, IELTS, AWS Certified. Tuyệt đối không chứa dự án, sản phẩm, website hoặc liên kết GitHub.' },
    projects: { type: 'array', items: { type: 'string' }, maxItems: 16, description: 'Tên và mô tả dự án/sản phẩm, website, ứng dụng, team project và liên kết repository GitHub.' },
  },
}

const normalizeText = (value) => typeof value === 'string' && value.trim() ? value.trim() : null

const normalizeList = (value, field) => {
  if (!Array.isArray(value)) throw new TypeError(`Invalid CV analysis field: ${field}`)
  return [...new Set(value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean))]
}

const projectIndicators = /(?:\bproject\b|\bteam\s*project\b|\bgithub\b|https?:\/\/|\bwebsite\b|\bweb\s*(?:site|app|application)\b|\bapplication\b|\bapp\b|\bchatbot\b|\brepository\b|\bdự\s*án\b|\bsản\s*phẩm\b|\bứng\s*dụng\b)/iu
const certificateIndicators = /(?:\bcertificate\b|\bcertification\b|\bcertified\b|\bchứng\s*chỉ\b|\bchứng\s*nhận\b|\btoeic\b|\bielts\b|\btoefl\b|\bmos\b|\bic3\b|\baws\b|\bazure\b|\bcoursera\b)/iu

const normalizeCareerCategories = (result) => {
  const projects = [...result.projects]
  const projectKeys = new Set(projects.map((item) => item.toLocaleLowerCase('vi')))
  const certificates = []

  result.certificates.forEach((item) => {
    const key = item.toLocaleLowerCase('vi')
    const isAlreadyProject = projectKeys.has(key)
    const looksLikeProject = projectIndicators.test(item) && !certificateIndicators.test(item)
    if (!isAlreadyProject && !looksLikeProject) {
      certificates.push(item)
      return
    }
    if (!isAlreadyProject) {
      projects.push(item)
      projectKeys.add(key)
    }
  })

  return { ...result, certificates, projects }
}

const validateCvAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
    throw new TypeError('Invalid CV analysis payload')
  }
  let result = {
    ...Object.fromEntries(ANALYSIS_TEXT_FIELDS.map((field) => [field, normalizeText(analysis[field])])),
    ...Object.fromEntries(ANALYSIS_LIST_FIELDS.map((field) => [field, normalizeList(analysis[field], field)])),
    avatarAbsolutePath: normalizeText(analysis.avatarAbsolutePath),
  }
  result = normalizeCareerCategories(result)
  const hasStructuredContent = ANALYSIS_TEXT_FIELDS.some((field) => result[field])
    || ANALYSIS_LIST_FIELDS.some((field) => result[field].length > 0)
  result.extractionStatus = result.candidateName && (result.candidateEmail || result.candidatePhone)
    ? 'completed'
    : hasStructuredContent ? 'partial' : 'failed'
  return result
}

module.exports = { cvAnalysisSchema, validateCvAnalysis }
