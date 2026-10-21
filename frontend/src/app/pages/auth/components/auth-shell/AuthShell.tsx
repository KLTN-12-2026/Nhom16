import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-page__intro">
        <Link className="auth-brand" to="/"><span><i className="bi bi-briefcase" /></span>Tuyển Dụng Thông Minh</Link>
        <div><span className="eyebrow">Kết nối đúng người, đúng cơ hội</span><h1>Tuyển dụng rõ ràng hơn, hành trình nghề nghiệp thuận lợi hơn.</h1><p>Một không gian thống nhất để tìm việc, quản lý hồ sơ và xây dựng đội ngũ phù hợp.</p></div>
        <small>Thông tin của bạn được bảo vệ và chỉ sử dụng cho hoạt động tuyển dụng.</small>
      </section>
      <section className="auth-page__content">
        <div className="auth-panel"><div className="auth-panel__heading"><h2>{title}</h2><p>{description}</p></div>{children}</div>
      </section>
    </main>
  )
}
