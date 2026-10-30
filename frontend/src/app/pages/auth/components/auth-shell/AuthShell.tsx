import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { AppLogo } from '../../../../components/app-logo'

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-page__content">
        <div className="auth-panel">
          <Link className="auth-brand" to="/"><AppLogo compact /></Link>
          <div className="auth-panel__heading"><h2>{title}</h2><p>{description}</p></div>{children}
        </div>
      </section>
    </main>
  )
}
