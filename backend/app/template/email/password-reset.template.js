const createPasswordResetEmail = ({ fullName, resetUrl }) => ({
  subject: 'Đặt lại mật khẩu TopCV',
  text: `Xin chào ${fullName},\n\nBạn có thể đặt lại mật khẩu tại: ${resetUrl}\nLiên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
  html: `<p>Xin chào ${fullName},</p><p>Bạn vừa yêu cầu đặt lại mật khẩu.</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
})

module.exports = { createPasswordResetEmail }
