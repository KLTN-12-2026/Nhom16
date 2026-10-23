const yup = require('yup')

const { validationError } = require('../../util')

const loginSchema = yup.object({
  email: yup.string().trim().lowercase().email('Email không đúng định dạng.').required('Vui lòng nhập email.'),
  password: yup.string().required('Vui lòng nhập mật khẩu.'),
  recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
}).noUnknown(true)

const validateLoginPayload = async (payload) => {
  try {
    return await loginSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Thông tin đăng nhập chưa hợp lệ.')
  }
}

module.exports = { loginSchema, validateLoginPayload }
