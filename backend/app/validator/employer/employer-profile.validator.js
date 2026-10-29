const yup = require('yup')
const { validationError } = require('../../util')

const updateEmployerProfileSchema = yup.object({
  companyName: yup.string().trim().min(2, 'Tên công ty phải có ít nhất 2 ký tự.').max(200),
  logo: yup.string().trim().url('Đường dẫn logo không hợp lệ.').nullable().transform(v => v || null),
  companyPhone: yup.string().trim().matches(/^[0-9+().\s-]{8,20}$/, 'Số điện thoại không hợp lệ.').nullable().transform(v => v || null),
  companyAddress: yup.string().trim().min(10, 'Địa chỉ doanh nghiệp cần cụ thể hơn (tối thiểu 10 ký tự).').max(500),
  companyWebsite: yup.string().trim().url('Website doanh nghiệp không hợp lệ (cần https://).').nullable().transform(v => v || null),
  companySize: yup.string().trim().max(50).nullable().transform(v => v || null),
  description: yup.string().trim().max(3000).nullable().transform(v => v || null),
  representativeName: yup.string().trim().min(2).max(150),
  representativePosition: yup.string().trim().max(100),
}).noUnknown(true)

const validateUpdateEmployerProfile = async (payload) => {
  try {
    return await updateEmployerProfileSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Thông tin hồ sơ doanh nghiệp chưa hợp lệ.')
  }
}

module.exports = { validateUpdateEmployerProfile }
