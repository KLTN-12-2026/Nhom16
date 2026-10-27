import { NavLink, useNavigate } from 'react-router-dom'

import { ROLE, type Role } from '../../constants/role.constant'
import { ROUTE } from '../../constants/route.constant'
import { useAuth } from '../../provider/auth-provider'

const menus: Partial<Record<Role, { label: string; to: string }[]>> = {
  [ROLE.CANDIDATE]: [
    { label: 'Tìm việc', to: ROUTE.CANDIDATE_JOBS },
    { label: 'CV của tôi', to: '/candidate/cv' },
    { label: 'Việc đã ứng tuyển', to: '/candidate/applications' },
    { label: 'Việc đã lưu', to: '/candidate/saved-jobs' },
  ],
  [ROLE.EMPLOYER]: [
    { label: 'Tin tuyển dụng', to: '/employer/jobs' },
    { label: 'Hồ sơ ứng tuyển', to: '/employer/applications' },
    { label: 'Ứng viên phù hợp', to: '/employer/recommendations' },
    { label: 'Doanh nghiệp', to: '/employer/company' },
  ],
}

export function PortalHeader({ role }: { role: Extract<Role, 1 | 2> }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTE.HOME, { replace: true })
  }

  return (
    <header className="portal-header">
      <div className="container portal-header__inner">
        <NavLink className="portal-brand" to={role === ROLE.CANDIDATE ? ROUTE.CANDIDATE_HOME : ROUTE.EMPLOYER_HOME}>
          <span className="portal-brand__mark"><i className="bi bi-briefcase" /></span>
          <span>Tuyển Dụng Thông Minh</span>
        </NavLink>
        <nav className="portal-nav" aria-label="Điều hướng tài khoản">
          {menus[role]?.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="portal-account">
          <span className="portal-account__avatar">{user?.fullName.charAt(0).toUpperCase()}</span>
          <span className="portal-account__name">{user?.fullName}</span>
          <button type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </div>
    </header>
  )
}
