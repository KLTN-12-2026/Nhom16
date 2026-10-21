import { Outlet } from 'react-router-dom'

import { BackToTop } from '../../components/back-to-top'

export function PublicLayout() {
  return <><Outlet /><BackToTop /></>
}
