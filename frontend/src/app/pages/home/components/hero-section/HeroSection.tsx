import { type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTE } from '../../../../constants/route.constant'
import { trustStats } from '../../home.data'

function JobSearchForm() {
  const navigate = useNavigate()
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const search = new URLSearchParams()
    const keyword = String(values.get('keyword') || '').trim()
    const location = String(values.get('location') || '').trim()
    if (keyword) search.set('keyword', keyword)
    if (location) search.set('location', location)
    navigate(`${ROUTE.JOBS}${search.size ? `?${search}` : ''}`)
  }
  return (
    <form className="job-search" role="search" onSubmit={handleSubmit}>
      <div className="search-field search-field--keyword">
        <label htmlFor="home-keyword">Vị trí hoặc kỹ năng</label>
        <div className="search-input">
          <i className="bi bi-search" aria-hidden="true" />
          <input id="home-keyword" name="keyword" placeholder="Ví dụ: ReactJS, Business Analyst" />
        </div>
      </div>
      <div className="search-field">
        <label htmlFor="home-location">Địa điểm</label>
        <div className="search-input">
          <i className="bi bi-geo-alt" aria-hidden="true" />
          <select id="home-location" name="location" defaultValue="">
            <option value="">Tất cả địa điểm</option>
            <option value="da-nang">Đà Nẵng</option>
            <option value="ho-chi-minh">Hồ Chí Minh</option>
            <option value="ha-noi">Hà Nội</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary search-button" type="submit">
        Tìm việc ngay <i className="bi bi-arrow-right" aria-hidden="true" />
      </button>
    </form>
  )
}

function AnalysisPreview() {
  return (
    <div className="analysis-preview" aria-label="Minh họa kết quả phân tích CV bằng AI">
      <div className="preview-header">
        <div className="preview-title">
          <span className="preview-icon"><i className="bi bi-file-earmark-person" /></span>
          <div><strong>CV của Nguyễn Minh Anh</strong><small>Frontend Developer</small></div>
        </div>
        <span className="analysis-status"><i className="bi bi-check-circle-fill" /> Đã phân tích</span>
      </div>
      <div className="overall-score">
        <div className="score-ring" aria-label="Điểm phù hợp 92 trên 100"><strong>92</strong><span>/100</span></div>
        <div><span className="score-label">Mức độ phù hợp</span><h2>Rất phù hợp</h2><p>Hồ sơ đáp ứng tốt yêu cầu của vị trí.</p></div>
      </div>
      <div className="score-details">
        <div className="score-row">
          <div><span>Kỹ năng chuyên môn</span><strong>94%</strong></div>
          <div className="progress-track" role="progressbar" aria-label="Kỹ năng chuyên môn" aria-valuenow={94} aria-valuemin={0} aria-valuemax={100}><span style={{ width: '94%' }} /></div>
        </div>
        <div className="score-row">
          <div><span>Kinh nghiệm liên quan</span><strong>88%</strong></div>
          <div className="progress-track progress-track--teal" role="progressbar" aria-label="Kinh nghiệm liên quan" aria-valuenow={88} aria-valuemin={0} aria-valuemax={100}><span style={{ width: '88%' }} /></div>
        </div>
      </div>
      <div className="matched-skills" aria-label="Kỹ năng nổi bật">
        <span><i className="bi bi-check2" /> ReactJS</span><span><i className="bi bi-check2" /> TypeScript</span><span><i className="bi bi-check2" /> UI/UX</span>
      </div>
      <div className="preview-note"><i className="bi bi-lightbulb-fill" aria-hidden="true" /><p><strong>Gợi ý từ AI:</strong> Bổ sung số liệu đo lường kết quả trong phần kinh nghiệm để CV thuyết phục hơn.</p></div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section id="top" className="hero-section" aria-labelledby="hero-title">
      <div className="hero-glow hero-glow--one" /><div className="hero-glow hero-glow--two" />
      <div className="container hero-container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 hero-content">
            <span className="eyebrow"><i className="bi bi-stars" /> Nền tảng tuyển dụng tích hợp AI</span>
            <h1 id="hero-title">Tìm đúng công việc.<br /><span>Chọn đúng nhân tài.</span></h1>
            <p className="hero-description">AI hỗ trợ phân tích CV, đánh giá mức độ phù hợp và kết nối ứng viên với doanh nghiệp nhanh chóng, minh bạch hơn.</p>
            <JobSearchForm />
            <div className="hero-links">
              <Link to={ROUTE.CV_ANALYSIS}><i className="bi bi-file-earmark-arrow-up" /> Tải CV để nhận đánh giá</Link>
              <span aria-hidden="true" />
              <p><i className="bi bi-shield-check" /> Dữ liệu được bảo vệ an toàn</p>
            </div>
          </div>
          <div className="col-lg-6 hero-visual-column">
            <AnalysisPreview />
            <div className="floating-card floating-card--jobs" aria-hidden="true"><span><i className="bi bi-briefcase-fill" /></span><div><strong>24 việc làm phù hợp</strong><small>Được AI đề xuất cho bạn</small></div></div>
            <div className="floating-card floating-card--verified" aria-hidden="true"><i className="bi bi-patch-check-fill" /><div><strong>Hồ sơ nổi bật</strong><small>Top 8% ứng viên</small></div></div>
          </div>
        </div>
        <div className="trust-strip" aria-label="Số liệu tổng quan của hệ thống">
          {trustStats.map((item) => <div className="trust-stat" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
        </div>
      </div>
    </section>
  )
}
