export default function EmployerHomePage() {
  return (
    <main className="role-home container">
      <section className="role-home__welcome role-home__welcome--employer">
        <div><span className="eyebrow">Trung tâm tuyển dụng</span><h1>Quản lý nhu cầu tuyển người rõ ràng và hiệu quả</h1><p>Đăng tin, theo dõi hồ sơ và lựa chọn ứng viên phù hợp với từng vị trí.</p></div>
        <a className="btn btn-primary" href="/employer/jobs/new">Đăng tin tuyển dụng</a>
      </section>
      <section className="role-home__grid" aria-label="Lối tắt cho nhà tuyển dụng">
        <a href="/employer/jobs"><i className="bi bi-briefcase" /><div><strong>Tin tuyển dụng</strong><span>Quản lý các vị trí đang tuyển</span></div></a>
        <a href="/employer/applications"><i className="bi bi-people" /><div><strong>Hồ sơ ứng tuyển</strong><span>Theo dõi và cập nhật trạng thái</span></div></a>
        <a href="/employer/recommendations"><i className="bi bi-person-check" /><div><strong>Ứng viên phù hợp</strong><span>Rút ngắn thời gian sàng lọc</span></div></a>
      </section>
    </main>
  )
}
