const yup = require('yup')
const { validationError } = require('../../util')

const updateCandidateProfileSchema = yup.object({
  fullName: yup.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự.').max(150),
  phone: yup.string().trim().matches(/^[0-9+().\s-]{8,20}$/, 'Số điện thoại không hợp lệ.').nullable().transform(v => v || null),
  address: yup.string().trim().max(500).nullable().transform(v => v || null),
  title: yup.string().trim().max(150).nullable().transform(v => v || null),
  bio: yup.string().trim().max(2000).nullable().transform(v => v || null),
  skills: yup.array().of(yup.string().trim()).nullable(),
  education: yup.array().nullable(),
  experience: yup.array().nullable(),
}).noUnknown(true)

const validateUpdateCandidateProfile = async (payload) => {
  try {
    return await updateCandidateProfileSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Thông tin hồ sơ ứng viên chưa hợp lệ.')
  }
}

module.exports = { validateUpdateCandidateProfile }
