const assert = require('node:assert/strict')

const { ROLES } = require('../../app/constants')
const { validateRegisterPayload } = require('../../app/validator/auth')

const validPayload = {
  fullName: 'Nguyễn Văn An',
  email: 'Candidate@Example.com',
  password: 'Secure@123',
  confirmPassword: 'Secure@123',
  role: ROLES.CANDIDATE,
  recaptchaToken: 'recaptcha-token',
}

describe('register validator', () => {
  it('normalizes a valid public registration', async () => {
    const result = await validateRegisterPayload(validPayload)

    assert.equal(result.email, 'candidate@example.com')
    assert.equal(result.fullName, 'Nguyễn Văn An')
    assert.equal(result.role, ROLES.CANDIDATE)
  })

  it('rejects public administrator registration', async () => {
    await assert.rejects(
      validateRegisterPayload({ ...validPayload, role: ROLES.ADMIN }),
      (error) => error.statusCode === 422 && error.details.role === 'Loại tài khoản không hợp lệ.',
    )
  })

  it('returns field-level password errors', async () => {
    await assert.rejects(
      validateRegisterPayload({ ...validPayload, password: 'weak', confirmPassword: 'different' }),
      (error) => error.statusCode === 422 && Boolean(error.details.password) && error.details.confirmPassword === 'Mật khẩu xác nhận không khớp.',
    )
  })
})
