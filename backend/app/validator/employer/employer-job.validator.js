const yup = require('yup')
const { validationError } = require('../../util')

const words = value => String(value || '').normalize('NFKC').match(/[\p{L}\p{N}+#.]+/gu) || []
const meaningfulSentence = value => {
  const tokens = words(value)
  return tokens.length >= 2 && new Set(tokens.map(token => token.toLowerCase())).size >= Math.min(2, tokens.length)
}
const normalizeMultilineItems = (items) => {
  if (!Array.isArray(items)) return items
  const merged = []
  items.map(item => String(item || '').trim()).filter(Boolean).forEach((item) => {
    if (words(item).length < 3 && merged.length > 0 && !/^[-•*+]/.test(item)) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}, ${item}`
    } else {
      merged.push(item)
    }
  })
  return merged
}
const isTodayOrFuture = (value) => {
  if (!value) return false
  const candidate = new Date(value)
  if (Number.isNaN(candidate.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return candidate.getTime() >= today.getTime()
}

const jobSchema = yup.object({
  categoryId: yup.number().integer().positive().required(), title: yup.string().trim().min(3, 'Chức danh cần ít nhất 3 ký tự.').max(220).required(),
  salaryMin: yup.number().integer().min(0).nullable(), salaryMax: yup.number().integer().min(0).nullable(),
  location: yup.string().trim().min(2).max(120).required(), workMode: yup.string().oneOf(['OFFICE', 'HYBRID', 'REMOTE']).required(),
  experienceLevel: yup.string().oneOf(['NONE', '1_2', '2_5', 'OVER_5']).required(),
  employmentType: yup.string().oneOf(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT']).required(),
  positionLevel: yup.string().oneOf(['INTERN', 'STAFF', 'MANAGER']).required(),
  description: yup.string().trim().min(40, 'Mô tả công việc cần ít nhất 40 ký tự.').test('meaningful-description', 'Mô tả công việc cần có ít nhất 8 từ có ý nghĩa.', value => words(value).length >= 8).required(),
  requirements: yup.array().transform(normalizeMultilineItems).of(yup.string().trim().test('meaningful-requirement', 'Mỗi yêu cầu cần mô tả rõ ít nhất 2 từ.', meaningfulSentence)).min(1).required(),
  benefits: yup.array().transform(normalizeMultilineItems).of(yup.string().trim().test('meaningful-benefit', 'Mỗi quyền lợi cần mô tả rõ ít nhất 2 từ.', meaningfulSentence)).min(1).required(), skills: yup.array().of(yup.string().trim().min(1)).min(1).required(),
  deadline: yup.date().test('deadline-from-today', 'Hạn nộp phải từ hôm nay trở đi.', isTodayOrFuture).required(), publish: yup.boolean().default(false),
}).test('salary-range', 'Mức lương tối đa phải lớn hơn hoặc bằng mức tối thiểu.', value => !value?.salaryMin || !value?.salaryMax || value.salaryMax >= value.salaryMin).noUnknown(true)

const validateJob = async (payload) => {
  try { return await jobSchema.validate(payload, { abortEarly: false, stripUnknown: true }) }
  catch (error) { throw validationError(error, 'Thông tin tin tuyển dụng chưa hợp lệ.') }
}

const validateJobUpdate = async (payload) => {
  try { return await jobSchema.omit(['publish']).validate(payload, { abortEarly: false, stripUnknown: true }) }
  catch (error) { throw validationError(error, 'Thông tin tin tuyển dụng chưa hợp lệ.') }
}

module.exports = { validateJob, validateJobUpdate }
