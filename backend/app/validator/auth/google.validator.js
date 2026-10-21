const yup = require('yup')

const { PUBLIC_REGISTRATION_ROLES } = require('../../constants')
const { ApiError } = require('../../util/api-error')

const googleSchema = yup.object({
  credential: yup.string().trim().required('Không nhận được thông tin xác thực Google.'),
  role: yup.string().oneOf(PUBLIC_REGISTRATION_ROLES, 'Loại tài khoản không hợp lệ.').optional(),
  recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
}).noUnknown(true)

const validateGooglePayload = async (payload) => {
  try {
    return await googleSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    const details = error.inner?.length
      ? error.inner.reduce((result, item) => ({ ...result, [item.path]: item.message }), {})
      : { form: error.message }
    throw new ApiError(422, 'Thông tin đăng nhập Google chưa hợp lệ.', 'VALIDATION_ERROR', details)
  }
}

module.exports = { googleSchema, validateGooglePayload }
