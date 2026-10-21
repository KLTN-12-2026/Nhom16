export default function AdminDashboardPage() {
  return (
    <section className="admin-page">
      <span className="eyebrow">Quản trị hệ thống</span>
      <h1>Tổng quan hoạt động</h1>
      <p>Theo dõi người dùng, tin tuyển dụng và tình trạng vận hành của nền tảng.</p>
      <div className="admin-metrics">
        <article><i className="bi bi-people" /><span>Người dùng</span><strong>Chưa có dữ liệu</strong></article>
        <article><i className="bi bi-building" /><span>Doanh nghiệp</span><strong>Chưa có dữ liệu</strong></article>
        <article><i className="bi bi-briefcase" /><span>Tin tuyển dụng</span><strong>Chưa có dữ liệu</strong></article>
      </div>
    </section>
  )
}
