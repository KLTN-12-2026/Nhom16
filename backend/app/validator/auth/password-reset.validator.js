const yup = require('yup')

const { validationError } = require('../../util/error.helper')

const passwordRules = yup.string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
  .max(72, 'Mật khẩu không được vượt quá 72 ký tự.')
  .matches(/[a-z]/, 'Mật khẩu cần có chữ thường.')
  .matches(/[A-Z]/, 'Mật khẩu cần có chữ hoa.')
  .matches(/[0-9]/, 'Mật khẩu cần có chữ số.')
  .matches(/[^A-Za-z0-9]/, 'Mật khẩu cần có ký tự đặc biệt.')
  .required('Vui lòng nhập mật khẩu mới.')

const forgotPasswordSchema = yup.object({
  email: yup.string().trim().lowercase().email('Email không đúng định dạng.').required('Vui lòng nhập email.'),
}).noUnknown(true)

const resetPasswordSchema = yup.object({
  token: yup.string().trim().required('Liên kết đặt lại mật khẩu không hợp lệ.'),
  password: passwordRules,
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp.').required('Vui lòng xác nhận mật khẩu.'),
}).noUnknown(true)

const validate = (schema, message) => async (payload) => {
  try {
    return await schema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, message)
  }
}

const validateForgotPasswordPayload = validate(forgotPasswordSchema, 'Thông tin yêu cầu đặt lại mật khẩu chưa hợp lệ.')
const validateResetPasswordPayload = validate(resetPasswordSchema, 'Thông tin đặt lại mật khẩu chưa hợp lệ.')

module.exports = {
  forgotPasswordSchema,
  resetPasswordSchema,
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
}
