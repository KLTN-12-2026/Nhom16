const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

const createEmployerReviewEmail = ({ fullName, companyName, verificationStatus, reason }) => {
  const approved = verificationStatus === 'VERIFIED'
  const subject = approved ? 'Hồ sơ doanh nghiệp đã được chấp thuận' : 'Kết quả xét duyệt hồ sơ doanh nghiệp'
  const message = approved
    ? `Hồ sơ ${companyName} đã được chấp thuận. Bạn có thể đăng nhập để tiếp tục sử dụng các tính năng tuyển dụng.`
    : `Hồ sơ ${companyName} chưa được chấp thuận. Lý do: ${reason}`
  return {
    subject,
    text: `Xin chào ${fullName},\n\n${message}\n\nTuyển Dụng Thông Minh`,
    html: `<p>Xin chào ${escapeHtml(fullName)},</p><p>${escapeHtml(message)}</p><p>Tuyển Dụng Thông Minh</p>`,
  }
}

module.exports = { createEmployerReviewEmail }
