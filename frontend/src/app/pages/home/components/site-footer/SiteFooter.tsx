export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#top" aria-label="TuyenDungAI - Trang chủ">
            <span className="brand-mark" aria-hidden="true"><i className="bi bi-stars" /></span>
            <span className="brand-name">TuyenDung<span>AI</span></span>
          </a>
          <p>Kết nối đúng người với đúng cơ hội bằng dữ liệu và trí tuệ nhân tạo.</p>
        </div>
        <div className="footer-links"><strong>Ứng viên</strong><a href="#featured-jobs">Tìm việc làm</a><a href="#ai-workflow">Phân tích CV</a><a href="#categories">Ngành nghề</a></div>
        <div className="footer-links"><strong>Doanh nghiệp</strong><a href="#post-job">Đăng tin</a><a href="#employer">Tìm ứng viên</a><a href="#employer-detail">Giải pháp AI</a></div>
        <div className="footer-links"><strong>Hỗ trợ</strong><a href="#help">Trung tâm trợ giúp</a><a href="#privacy">Chính sách bảo mật</a><a href="#contact">Liên hệ</a></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 TuyenDungAI. Đồ án tốt nghiệp Nhóm 16.</span><span>Thiết kế vì trải nghiệm tuyển dụng tốt hơn.</span></div>
    </footer>
  )
}
