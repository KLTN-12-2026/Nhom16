import { Outlet } from 'react-router-dom'

import { BackToTop } from '../../components/back-to-top'
import { PortalHeader } from '../../components/portal-header'

export function EmployerLayout() {
  return <div className="portal-shell"><PortalHeader role="EMPLOYER" /><Outlet /><BackToTop /></div>
}
