const yup = require('yup')

const { ApiError } = require('../../util/api-error')

const toApiError = (error, message) => {
  const details = error.inner?.length
    ? error.inner.reduce((result, item) => ({ ...result, [item.path]: item.message }), {})
    : { form: error.message }
  return new ApiError(422, message, 'VALIDATION_ERROR', details)
}

const loginSchema = yup.object({
  email: yup.string().trim().lowercase().email('Email không đúng định dạng.').required('Vui lòng nhập email.'),
  password: yup.string().required('Vui lòng nhập mật khẩu.'),
  recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
}).noUnknown(true)

const validateLoginPayload = async (payload) => {
  try {
    return await loginSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw toApiError(error, 'Thông tin đăng nhập chưa hợp lệ.')
  }
}

module.exports = { loginSchema, validateLoginPayload }
