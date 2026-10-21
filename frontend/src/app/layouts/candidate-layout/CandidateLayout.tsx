import { Outlet } from 'react-router-dom'

import { BackToTop } from '../../components/back-to-top'
import { PortalHeader } from '../../components/portal-header'

export function CandidateLayout() {
  return <div className="portal-shell"><PortalHeader role="CANDIDATE" /><Outlet /><BackToTop /></div>
}
