const assert = require('node:assert/strict')

const {
  createEmailVerificationEmail,
  createEmployerReviewEmail,
  createGoogleOtpEmail,
  createGoogleWelcomeEmail,
  createPasswordResetEmail,
} = require('../../../app/template')

const assertProfessionalEmail = (email) => {
  assert.ok(email.subject.startsWith('[TopCV]'))
  assert.match(email.text, /Đội ngũ TopCV/)
  assert.match(email.html, /<!doctype html>/i)
  assert.match(email.html, /top<span style="color:#00b14f;">CV<\/span>/)
  assert.match(email.html, /Tiếp lợi thế, nối thành công/)
  assert.doesNotMatch(email.text, /undefined|null/)
  assert.doesNotMatch(email.html, /undefined|null/)
}

describe('Professional email templates', () => {
  it('renders all supported email flows with a consistent TopCV layout', () => {
    const emails = [
      createEmailVerificationEmail({
        fullName: 'Nguyễn Văn A',
        verificationUrl: 'http://localhost:5173/verify-email?token=verification-token',
      }),
      createPasswordResetEmail({
        fullName: 'Nguyễn Văn A',
        resetUrl: 'http://localhost:5173/reset-password?token=reset-token',
      }),
      createGoogleOtpEmail({ fullName: 'Nguyễn Văn A', code: '123456' }),
      createGoogleWelcomeEmail({ fullName: 'Nguyễn Văn A' }),
      createEmployerReviewEmail({
        fullName: 'Nguyễn Văn A',
        companyName: 'Công ty TNHH TopCV Test',
        verificationStatus: 'VERIFIED',
      }),
      createEmployerReviewEmail({
        fullName: 'Nguyễn Văn A',
        companyName: 'Công ty TNHH TopCV Test',
        verificationStatus: 'REJECTED',
        reason: 'Giấy phép kinh doanh chưa rõ nét.',
      }),
    ]

    emails.forEach(assertProfessionalEmail)
  })

  it('includes clear calls to action, fallback links and expiry information', () => {
    const verificationUrl = 'http://localhost:5173/verify-email?token=abc&source=email'
    const verification = createEmailVerificationEmail({
      fullName: 'Nguyễn Văn A',
      verificationUrl,
    })
    const reset = createPasswordResetEmail({
      fullName: 'Nguyễn Văn A',
      resetUrl: 'http://localhost:5173/reset-password?token=xyz',
    })

    assert.match(verification.text, /Xác minh tài khoản:/)
    assert.match(verification.text, /Thời hạn: 24 giờ/)
    assert.ok(verification.text.includes(verificationUrl))
    assert.match(verification.html, /token=abc&amp;source=email/)
    assert.match(verification.html, /Nếu nút không hoạt động/)

    assert.match(reset.text, /Tạo mật khẩu mới:/)
    assert.match(reset.text, /Thời hạn: 30 phút/)
    assert.match(reset.html, /Lưu ý bảo mật:/)
  })

  it('escapes untrusted recipient and employer-review content', () => {
    const email = createEmployerReviewEmail({
      fullName: '<script>alert("name")</script>',
      companyName: 'A&B <Company>',
      verificationStatus: 'REJECTED',
      reason: '<img src=x onerror=alert(1)>',
    })

    assert.doesNotMatch(email.html, /<script>|<img src=x/)
    assert.match(email.html, /&lt;script&gt;alert\(&quot;name&quot;\)&lt;\/script&gt;/)
    assert.match(email.html, /A&amp;B &lt;Company&gt;/)
    assert.match(email.html, /&lt;img src=x onerror=alert\(1\)&gt;/)
  })

  it('shows OTP prominently without exposing it in the subject', () => {
    const email = createGoogleOtpEmail({ fullName: 'Nguyễn Văn A', code: '654321' })

    assert.doesNotMatch(email.subject, /654321/)
    assert.match(email.text, /Mã xác minh: 654321/)
    assert.match(email.html, />654321<\/div>/)
    assert.match(email.text, /10 phút/)
  })
})
