import { Link } from 'react-router-dom'

import { ROUTE } from '../../constants/route.constant'

export default function CandidateHomePage() {
  return (
    <main className="role-home container">
      <section className="role-home__welcome">
        <div><span className="eyebrow">Không gian tìm việc của bạn</span><h1>Tìm cơ hội phù hợp với định hướng nghề nghiệp</h1><p>Cập nhật hồ sơ, quản lý CV và theo dõi các công việc bạn quan tâm tại một nơi.</p></div>
        <Link className="btn btn-primary" to={ROUTE.CANDIDATE_JOBS}>Tìm việc ngay</Link>
      </section>
      <section className="role-home__grid" aria-label="Lối tắt cho ứng viên">
        <a href="/candidate/cv"><i className="bi bi-file-earmark-person" /><div><strong>CV của tôi</strong><span>Quản lý hồ sơ dùng khi ứng tuyển</span></div></a>
        <a href="/candidate/recommendations"><i className="bi bi-compass" /><div><strong>Việc làm phù hợp</strong><span>Khám phá cơ hội dựa trên hồ sơ</span></div></a>
        <a href="/candidate/applications"><i className="bi bi-send-check" /><div><strong>Đã ứng tuyển</strong><span>Theo dõi tiến trình hồ sơ</span></div></a>
      </section>
    </main>
  )
}
