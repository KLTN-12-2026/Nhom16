const yup = require('yup')

const { validationError } = require('../../util/error.helper')

const verifyEmailSchema = yup.object({
  token: yup.string().trim().required('Liên kết xác minh không hợp lệ.'),
}).noUnknown(true)

const resendVerificationSchema = yup.object({
  email: yup.string().trim().lowercase().email('Email không đúng định dạng.').required('Vui lòng nhập email.'),
}).noUnknown(true)

const validate = (schema, message) => async (payload) => {
  try {
    return await schema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, message)
  }
}

module.exports = {
  validateResendVerificationPayload: validate(resendVerificationSchema, 'Thông tin gửi lại email chưa hợp lệ.'),
  validateVerifyEmailPayload: validate(verifyEmailSchema, 'Thông tin xác minh email chưa hợp lệ.'),
}
