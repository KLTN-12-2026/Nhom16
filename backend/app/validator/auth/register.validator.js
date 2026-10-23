const yup = require('yup')

const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('../../constants')
const { validationError } = require('../../util')

const registerSchema = yup
  .object({
    fullName: yup.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự.').max(150, 'Họ và tên không được vượt quá 150 ký tự.').required('Vui lòng nhập họ và tên.'),
    email: yup.string().trim().lowercase().email('Email không đúng định dạng.').max(191, 'Email không được vượt quá 191 ký tự.').required('Vui lòng nhập email.'),
    password: yup.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.').max(72, 'Mật khẩu không được vượt quá 72 ký tự.').matches(/[a-z]/, 'Mật khẩu cần có chữ thường.').matches(/[A-Z]/, 'Mật khẩu cần có chữ hoa.').matches(/[0-9]/, 'Mật khẩu cần có chữ số.').matches(/[^A-Za-z0-9]/, 'Mật khẩu cần có ký tự đặc biệt.').required('Vui lòng nhập mật khẩu.'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp.').required('Vui lòng xác nhận mật khẩu.'),
    role: yup.number().integer().oneOf(PUBLIC_REGISTRATION_ROLES, 'Loại tài khoản không hợp lệ.').required('Vui lòng chọn loại tài khoản.'),
    companyName: yup.string().trim().max(200).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.min(2, 'Tên doanh nghiệp phải có ít nhất 2 ký tự.').required('Vui lòng nhập tên doanh nghiệp.'), otherwise: (schema) => schema.strip() }),
    taxCode: yup.string().trim().matches(/^\d{10}(\d{3})?$/, 'Mã số thuế phải gồm 10 hoặc 13 chữ số.').when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập mã số thuế.'), otherwise: (schema) => schema.strip() }),
    businessLicenseNumber: yup.string().trim().max(50).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập số giấy phép kinh doanh.'), otherwise: (schema) => schema.strip() }),
    companyPhone: yup.string().trim().matches(/^[0-9+().\s-]{8,20}$/, 'Số điện thoại doanh nghiệp không hợp lệ.').when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập số điện thoại doanh nghiệp.'), otherwise: (schema) => schema.strip() }),
    companyAddress: yup.string().trim().max(500).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.min(10, 'Địa chỉ doanh nghiệp cần cụ thể hơn.').required('Vui lòng nhập địa chỉ doanh nghiệp.'), otherwise: (schema) => schema.strip() }),
    companyWebsite: yup.string().trim().url('Website doanh nghiệp không hợp lệ.').nullable().transform((value) => value || null).when('role', { is: ROLES.EMPLOYER, otherwise: (schema) => schema.strip() }),
    representativeName: yup.string().trim().max(150).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.min(2).required('Vui lòng nhập người đại diện.'), otherwise: (schema) => schema.strip() }),
    representativePosition: yup.string().trim().max(100).when('role', { is: ROLES.EMPLOYER, then: (schema) => schema.required('Vui lòng nhập chức vụ người đại diện.'), otherwise: (schema) => schema.strip() }),
    termsAccepted: yup.boolean().oneOf([true], 'Bạn cần đồng ý với điều khoản sử dụng.').required(),
    recaptchaToken: yup.string().trim().required('Không thể xác minh yêu cầu. Vui lòng thử lại.'),
  })
  .noUnknown(true)

const validateRegisterPayload = async (payload) => {
  try {
    return await registerSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Thông tin đăng ký chưa hợp lệ.')
  }
}

module.exports = { registerSchema, validateRegisterPayload }
