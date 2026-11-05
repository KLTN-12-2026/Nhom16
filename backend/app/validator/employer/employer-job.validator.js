const yup = require('yup')
const { validationError } = require('../../util')

const jobSchema = yup.object({
  categoryId: yup.number().integer().positive().required(), title: yup.string().trim().min(5).max(220).required(),
  salaryMin: yup.number().integer().min(0).nullable(), salaryMax: yup.number().integer().min(0).nullable(),
  location: yup.string().trim().min(2).max(120).required(), workMode: yup.string().oneOf(['OFFICE', 'HYBRID', 'REMOTE']).required(),
  experienceLevel: yup.string().oneOf(['NONE', '1_2', '2_5', 'OVER_5']).required(),
  employmentType: yup.string().oneOf(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT']).required(),
  positionLevel: yup.string().oneOf(['INTERN', 'STAFF', 'MANAGER']).required(),
  description: yup.string().trim().min(20).required(), requirements: yup.array().of(yup.string().trim().min(1)).min(1).required(),
  benefits: yup.array().of(yup.string().trim().min(1)).min(1).required(), skills: yup.array().of(yup.string().trim().min(1)).min(1).required(),
  deadline: yup.date().min(new Date(), 'Hạn nộp phải từ hôm nay trở đi.').required(), publish: yup.boolean().default(false),
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
