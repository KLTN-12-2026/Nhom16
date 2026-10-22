import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-page__content">
        <div className="auth-panel">
          <Link className="auth-brand" to="/"><span><i className="bi bi-briefcase" /></span>Tuyển Dụng Thông Minh</Link>
          <div className="auth-panel__heading"><h2>{title}</h2><p>{description}</p></div>{children}
        </div>
      </section>
    </main>
  )
}
