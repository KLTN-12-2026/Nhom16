const yup = require('yup')

const { PUBLIC_REGISTRATION_ROLES } = require('../../constants')
const { validationError } = require('../../util/error.helper')

const googleSchema = yup.object({
  credential: yup.string().trim().required('Không nhận được thông tin xác thực Google.'),
  role: yup.number().integer().oneOf(PUBLIC_REGISTRATION_ROLES, 'Loại tài khoản không hợp lệ.').optional(),
  termsAccepted: yup.boolean().when('role', { is: (role) => Boolean(role), then: (schema) => schema.oneOf([true], 'Bạn cần đồng ý với điều khoản sử dụng.').required(), otherwise: (schema) => schema.strip() }),
  recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
}).noUnknown(true)

const validateGooglePayload = async (payload) => {
  try {
    return await googleSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Thông tin đăng nhập Google chưa hợp lệ.')
  }
}

module.exports = { googleSchema, validateGooglePayload }
