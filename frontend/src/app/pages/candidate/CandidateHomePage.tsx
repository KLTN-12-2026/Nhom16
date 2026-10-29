import { Link } from 'react-router-dom'

import { ROUTE } from '../../constants/route.constant'

export default function CandidateHomePage() {
  return (
    <main className="role-home container">
      <section className="role-home__welcome">
        <div>
          <span className="eyebrow">Không gian tìm việc của bạn</span>
          <h1>Tìm cơ hội phù hợp với định hướng nghề nghiệp</h1>
          <p>Cập nhật hồ sơ, quản lý CV và theo dõi các công việc bạn quan tâm tại một nơi.</p>
        </div>
        <Link className="btn btn-primary" to={ROUTE.CANDIDATE_JOBS}>Tìm việc ngay</Link>
      </section>
      <section className="role-home__grid" aria-label="Lối tắt cho ứng viên">
        <Link to="/candidate/profile">
          <i className="bi bi-person-lines-fill" />
          <div>
            <strong>Hồ sơ nghề nghiệp</strong>
            <span>Cập nhật kỹ năng, chức danh và thông tin liên hệ</span>
          </div>
        </Link>
        <Link to={ROUTE.CANDIDATE_JOBS}>
          <i className="bi bi-briefcase" />
          <div>
            <strong>Việc làm phù hợp</strong>
            <span>Khám phá cơ hội dựa trên hồ sơ</span>
          </div>
        </Link>
        <Link to="/candidate/profile">
          <i className="bi bi-stars" />
          <div>
            <strong>Kỹ năng chuyên môn</strong>
            <span>Hoàn thiện năng lực nổi bật cho CV</span>
          </div>
        </Link>
      </section>
    </main>
  )
}
