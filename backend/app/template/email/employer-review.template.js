const { createEmailLayout } = require('./email-layout.template')

const createEmployerReviewEmail = ({ fullName, companyName, verificationStatus, reason }) => {
  const approved = verificationStatus === 'VERIFIED'
  return createEmailLayout({
    subject: approved
      ? `[TopCV] Hồ sơ doanh nghiệp ${companyName} đã được phê duyệt`
      : `[TopCV] Cập nhật xét duyệt hồ sơ doanh nghiệp ${companyName}`,
    preheader: approved
      ? 'Hồ sơ doanh nghiệp của bạn đã được phê duyệt.'
      : 'Hồ sơ doanh nghiệp cần được cập nhật trước khi phê duyệt.',
    eyebrow: 'KẾT QUẢ XÉT DUYỆT DOANH NGHIỆP',
    title: approved ? 'Hồ sơ doanh nghiệp đã được phê duyệt' : 'Hồ sơ doanh nghiệp chưa được phê duyệt',
    fullName,
    paragraphs: [approved
      ? 'Cảm ơn bạn đã cung cấp thông tin xác minh. Doanh nghiệp của bạn đã hoàn tất quá trình xét duyệt trên TopCV.'
      : 'TopCV đã hoàn tất việc kiểm tra hồ sơ. Hiện tại hồ sơ chưa đáp ứng đủ điều kiện để được phê duyệt.'],
    details: [
      { label: 'Doanh nghiệp', value: companyName },
      { label: 'Trạng thái', value: approved ? 'Đã phê duyệt' : 'Cần cập nhật' },
    ],
    highlight: approved
      ? { title: 'Tài khoản tuyển dụng đã sẵn sàng', content: 'Bạn có thể đăng nhập để đăng tin tuyển dụng và sử dụng các chức năng dành cho nhà tuyển dụng.', tone: 'success' }
      : { title: 'Lý do chưa phê duyệt', content: reason || 'Thông tin xác minh chưa đầy đủ hoặc chưa hợp lệ.', tone: 'danger' },
    securityNote: approved
      ? 'Chỉ người được doanh nghiệp ủy quyền mới nên sử dụng tài khoản tuyển dụng này.'
      : 'Vui lòng kiểm tra, cập nhật đúng thông tin doanh nghiệp và gửi lại hồ sơ để được xét duyệt.',
  })
}

module.exports = { createEmployerReviewEmail }
