const createEmailVerificationEmail = ({ fullName, verificationUrl }) => ({
  subject: 'Xác minh tài khoản Tuyển Dụng Thông Minh',
  text: `Xin chào ${fullName},\n\nVui lòng xác minh tài khoản tại: ${verificationUrl}\nLiên kết có hiệu lực trong 24 giờ.`,
  html: `<p>Xin chào ${fullName},</p><p>Cảm ơn bạn đã đăng ký Tuyển Dụng Thông Minh.</p><p><a href="${verificationUrl}">Xác minh tài khoản</a></p><p>Liên kết có hiệu lực trong 24 giờ. Nếu bạn không đăng ký, hãy bỏ qua email này.</p>`,
})

module.exports = { createEmailVerificationEmail }
