const yup = require('yup')

const { PUBLIC_REGISTRATION_ROLES } = require('../../constants')
const { ApiError } = require('../../util/api-error')

const registerSchema = yup
  .object({
    fullName: yup.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự.').max(150, 'Họ và tên không được vượt quá 150 ký tự.').required('Vui lòng nhập họ và tên.'),
    email: yup.string().trim().lowercase().email('Email không đúng định dạng.').max(191, 'Email không được vượt quá 191 ký tự.').required('Vui lòng nhập email.'),
    password: yup.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.').max(72, 'Mật khẩu không được vượt quá 72 ký tự.').matches(/[a-z]/, 'Mật khẩu cần có chữ thường.').matches(/[A-Z]/, 'Mật khẩu cần có chữ hoa.').matches(/[0-9]/, 'Mật khẩu cần có chữ số.').matches(/[^A-Za-z0-9]/, 'Mật khẩu cần có ký tự đặc biệt.').required('Vui lòng nhập mật khẩu.'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp.').required('Vui lòng xác nhận mật khẩu.'),
    role: yup.string().oneOf(PUBLIC_REGISTRATION_ROLES, 'Loại tài khoản không hợp lệ.').required('Vui lòng chọn loại tài khoản.'),
    recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
  })
  .noUnknown(true)

const validateRegisterPayload = async (payload) => {
  try {
    return await registerSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    const details = error.inner?.length
      ? error.inner.reduce((result, item) => ({ ...result, [item.path]: item.message }), {})
      : { form: error.message }
    throw new ApiError(422, 'Thông tin đăng ký chưa hợp lệ.', 'VALIDATION_ERROR', details)
  }
}

module.exports = { registerSchema, validateRegisterPayload }
