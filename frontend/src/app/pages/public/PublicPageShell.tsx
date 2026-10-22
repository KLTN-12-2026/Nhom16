import type { ReactNode } from 'react'

import { SiteFooter } from '../home/components/site-footer'
import { SiteHeader } from '../home/components/site-header'
import '../home/home-page.scss'

export function PublicPageShell({ children }: { children: ReactNode }) {
  return <div className="home-page"><SiteHeader /><main>{children}</main><SiteFooter /></div>
}
