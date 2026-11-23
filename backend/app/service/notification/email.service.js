const nodemailer = require('nodemailer')

const { ApiError } = require('../../util')

const createEmailService = (config) => {
  const configured = Boolean(config.host && config.user && config.password)
  const transporter = configured && nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user.trim(), pass: config.password.replace(/\s/g, '') },
  })

  return {
    async send(message) {
      if (!transporter) throw new ApiError(503, 'Dịch vụ email chưa được cấu hình.', 'EMAIL_NOT_CONFIGURED')
      return transporter.sendMail({
        from: config.from,
        replyTo: config.replyTo || undefined,
        // Đánh dấu đây là mail giao dịch tự động để hộp thư không xử lý như thư hàng loạt/quảng cáo.
        headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'OOF, AutoReply' },
        ...message,
      })
    },
  }
}

module.exports = { createEmailService }
