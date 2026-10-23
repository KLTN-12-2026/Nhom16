const createGoogleOtpEmail = ({ code, fullName }) => ({
  subject: 'Mã xác minh đăng nhập Google',
  text: `Xin chào ${fullName}, mã xác minh của bạn là ${code}. Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.`,
  html: `<p>Xin chào ${fullName},</p><p>Mã xác minh đăng nhập Google của bạn là:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>`,
})

module.exports = { createGoogleOtpEmail }
