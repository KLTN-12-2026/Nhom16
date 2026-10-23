const yup = require('yup')

const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('../../constants')
const { validationError } = require('../../util/error.helper')

const googleStartSchema = yup.object({
  credential: yup.string().trim().required('Không nhận được thông tin xác thực Google.'),
  recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
}).noUnknown(true)

const googleCompleteSchema = yup.object({
  challengeId: yup.string().uuid('Phiên xác minh không hợp lệ.').required('Phiên xác minh không hợp lệ.'),
  code: yup.string().trim().matches(/^\d{6}$/, 'Mã xác minh phải gồm 6 chữ số.').required('Vui lòng nhập mã xác minh.'),
  role: yup.number().integer().oneOf(PUBLIC_REGISTRATION_ROLES, 'Loại tài khoản không hợp lệ.').optional(),
  termsAccepted: yup.boolean().when('role', { is: (role) => Boolean(role), then: (schema) => schema.oneOf([true], 'Bạn cần đồng ý với điều khoản sử dụng.').required(), otherwise: (schema) => schema.strip() }),
  companyName: yup.string().trim().max(200).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.min(2).required('Vui lòng nhập tên doanh nghiệp.'), otherwise: (schema) => schema.strip() }),
  taxCode: yup.string().trim().matches(/^\d{10}(\d{3})?$/, 'Mã số thuế phải gồm 10 hoặc 13 chữ số.').when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập mã số thuế.'), otherwise: (schema) => schema.strip() }),
  businessLicenseNumber: yup.string().trim().max(50).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập số giấy phép kinh doanh.'), otherwise: (schema) => schema.strip() }),
  companyPhone: yup.string().trim().matches(/^[0-9+().\s-]{8,20}$/, 'Số điện thoại doanh nghiệp không hợp lệ.').when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập số điện thoại doanh nghiệp.'), otherwise: (schema) => schema.strip() }),
  companyAddress: yup.string().trim().max(500).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.min(10).required('Vui lòng nhập địa chỉ doanh nghiệp.'), otherwise: (schema) => schema.strip() }),
  companyWebsite: yup.string().trim().url('Website doanh nghiệp không hợp lệ.').nullable().transform((value) => value || null).when('role', { is: ROLES.EMPLOYER, otherwise: (schema) => schema.strip() }),
  representativeName: yup.string().trim().max(150).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.min(2).required('Vui lòng nhập người đại diện.'), otherwise: (schema) => schema.strip() }),
  representativePosition: yup.string().trim().max(100).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập chức vụ người đại diện.'), otherwise: (schema) => schema.strip() }),
}).noUnknown(true)

const googleResendSchema = yup.object({
  challengeId: yup.string().uuid('Phiên xác minh không hợp lệ.').required('Phiên xác minh không hợp lệ.'),
}).noUnknown(true)

const validate = (schema, message) => async (payload) => {
  try {
    return await schema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, message)
  }
}

module.exports = {
  validateGoogleStartPayload: validate(googleStartSchema, 'Thông tin đăng nhập Google chưa hợp lệ.'),
  validateGoogleCompletePayload: validate(googleCompleteSchema, 'Thông tin hoàn tất đăng nhập Google chưa hợp lệ.'),
  validateGoogleResendPayload: validate(googleResendSchema, 'Thông tin gửi lại mã chưa hợp lệ.'),
}
