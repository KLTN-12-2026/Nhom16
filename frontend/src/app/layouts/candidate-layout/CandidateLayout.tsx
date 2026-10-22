import { Outlet } from 'react-router-dom'

import { BackToTop } from '../../components/back-to-top'
import { PortalHeader } from '../../components/portal-header'
import { ROLE } from '../../constants/role.constant'

export function CandidateLayout() {
  return <div className="portal-shell"><PortalHeader role={ROLE.CANDIDATE} /><Outlet /><BackToTop /></div>
}
