const { createEmailLayout } = require('./email-layout.template')

const createPasswordResetEmail = ({ fullName, resetUrl }) => createEmailLayout({
  subject: '[TopCV] Yêu cầu đặt lại mật khẩu',
  preheader: 'Sử dụng liên kết bảo mật để tạo mật khẩu mới cho tài khoản TopCV.',
  eyebrow: 'BẢO MẬT TÀI KHOẢN',
  title: 'Đặt lại mật khẩu TopCV',
  fullName,
  paragraphs: [
    'TopCV đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới.',
  ],
  action: { label: 'Tạo mật khẩu mới', url: resetUrl, expiresIn: '30 phút' },
  securityNote: 'Nếu bạn không gửi yêu cầu này, hãy bỏ qua email và không chia sẻ liên kết. Mật khẩu hiện tại của bạn vẫn được giữ nguyên.',
})

module.exports = { createPasswordResetEmail }
