const createGoogleWelcomeEmail = ({ fullName }) => ({
  subject: 'Đăng nhập Google thành công',
  text: `Xin chào ${fullName}, tài khoản Google của bạn đã được kết nối với TopCV.`,
  html: `<p>Xin chào ${fullName},</p><p>Tài khoản Google của bạn đã được kết nối với TopCV.</p>`,
})

module.exports = { createGoogleWelcomeEmail }
