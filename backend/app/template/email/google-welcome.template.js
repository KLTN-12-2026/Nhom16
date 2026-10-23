const createGoogleWelcomeEmail = ({ fullName }) => ({
  subject: 'Đăng nhập Google thành công',
  text: `Xin chào ${fullName}, tài khoản Google của bạn đã được kết nối với Tuyển Dụng Thông Minh.`,
  html: `<p>Xin chào ${fullName},</p><p>Tài khoản Google của bạn đã được kết nối với Tuyển Dụng Thông Minh.</p>`,
})

module.exports = { createGoogleWelcomeEmail }
