const { createEmailLayout } = require('./email-layout.template')

const createEmailVerificationEmail = ({ fullName, verificationUrl }) => createEmailLayout({
  subject: '[TopCV] Xác minh email để hoàn tất đăng ký',
  preheader: 'Chỉ còn một bước để kích hoạt tài khoản TopCV của bạn.',
  eyebrow: 'KÍCH HOẠT TÀI KHOẢN',
  title: 'Xác minh địa chỉ email của bạn',
  fullName,
  paragraphs: [
    'Cảm ơn bạn đã đăng ký TopCV. Vui lòng xác minh địa chỉ email để kích hoạt tài khoản và bảo vệ thông tin đăng nhập của bạn.',
  ],
  action: { label: 'Xác minh tài khoản', url: verificationUrl, expiresIn: '24 giờ' },
  securityNote: 'Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email. Không chuyển tiếp liên kết xác minh cho người khác.',
})

module.exports = { createEmailVerificationEmail }
