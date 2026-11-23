const { createEmailLayout } = require('./email-layout.template')

const createGoogleOtpEmail = ({ code, fullName }) => createEmailLayout({
  subject: '[TopCV] Mã xác minh đăng nhập Google',
  preheader: 'Mã xác minh một lần của bạn có hiệu lực trong 10 phút.',
  eyebrow: 'XÁC MINH ĐĂNG NHẬP',
  title: 'Mã xác minh của bạn',
  fullName,
  paragraphs: [
    'Nhập mã dưới đây tại màn hình xác minh để tiếp tục đăng nhập bằng Google.',
  ],
  verificationCode: code,
  highlight: { title: 'Thời hạn sử dụng', content: 'Mã chỉ có hiệu lực trong 10 phút và chỉ dùng được cho lần xác minh này.', tone: 'warning' },
  securityNote: 'TopCV không bao giờ yêu cầu bạn cung cấp mã này qua điện thoại, tin nhắn hoặc email. Không chia sẻ mã với bất kỳ ai.',
})

module.exports = { createGoogleOtpEmail }
