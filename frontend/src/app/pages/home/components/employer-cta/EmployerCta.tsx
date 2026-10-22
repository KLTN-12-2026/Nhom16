import { Link } from 'react-router-dom'

import { ROUTE } from '../../../../constants/route.constant'

const employerBenefits = [
  'AI phân tích và chuẩn hóa mô tả công việc',
  'Tự động xếp hạng ứng viên theo mức độ phù hợp',
  'Quản lý hồ sơ và quy trình tuyển dụng tập trung',
]

const candidates = [
  { initials: 'MA', name: 'Minh Anh', skills: 'ReactJS · TypeScript', score: 94, tone: 'blue' },
  { initials: 'TH', name: 'Thu Hà', skills: 'ReactJS · UI/UX', score: 89, tone: 'purple' },
  { initials: 'QN', name: 'Quang Nam', skills: 'JavaScript · NextJS', score: 86, tone: 'green' },
]

export function EmployerCta() {
  return (
    <section id="employer" className="section-block employer-section" aria-labelledby="employer-title">
      <div className="container">
        <div className="employer-panel">
          <div className="employer-content">
            <span className="section-kicker section-kicker--light">Giải pháp cho doanh nghiệp</span>
            <h2 id="employer-title">Tuyển đúng người,<br />tiết kiệm thời gian.</h2>
            <p>Đơn giản hóa quy trình sàng lọc với dữ liệu rõ ràng và khả năng phân tích của AI.</p>
            <ul>{employerBenefits.map((benefit) => <li key={benefit}><i className="bi bi-check-circle-fill" />{benefit}</li>)}</ul>
            <div className="employer-actions">
              <Link className="btn btn-light btn-lg" to={ROUTE.REGISTER}>Đăng ký doanh nghiệp</Link>
              <Link className="text-link-light" to={ROUTE.LOGIN}>Đăng nhập nhà tuyển dụng <i className="bi bi-arrow-right" /></Link>
            </div>
          </div>
          <div className="candidate-ranking" aria-label="Minh họa bảng xếp hạng ứng viên">
            <div className="ranking-header"><div><strong>Ứng viên phù hợp</strong><small>Frontend Developer</small></div><i className="bi bi-sliders" /></div>
            {candidates.map((candidate) => (
              <div className="candidate-row" key={candidate.name}>
                <span className={`candidate-avatar candidate-avatar--${candidate.tone}`}>{candidate.initials}</span>
                <div><strong>{candidate.name}</strong><small>{candidate.skills}</small></div>
                <span className="candidate-score">{candidate.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
