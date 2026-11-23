const { createEmailLayout } = require('./email-layout.template')

const createGoogleWelcomeEmail = ({ fullName }) => createEmailLayout({
  subject: '[TopCV] Tài khoản Google đã được kết nối',
  preheader: 'Bạn có thể sử dụng Google để đăng nhập TopCV nhanh chóng và an toàn.',
  eyebrow: 'KẾT NỐI THÀNH CÔNG',
  title: 'Chào mừng bạn đến với TopCV',
  fullName,
  paragraphs: [
    'Tài khoản Google của bạn đã được kết nối thành công với TopCV.',
    'Từ lần đăng nhập tiếp theo, bạn có thể chọn “Tiếp tục với Google” để truy cập tài khoản nhanh chóng.',
  ],
  highlight: { title: 'Kết nối đã được thiết lập', content: 'Bạn có thể tiếp tục hoàn thiện hồ sơ ứng viên hoặc hồ sơ doanh nghiệp trên hệ thống.', tone: 'success' },
  securityNote: 'Nếu bạn không thực hiện kết nối này, hãy đổi mật khẩu Google và liên hệ quản trị viên hệ thống.',
})

module.exports = { createGoogleWelcomeEmail }
