import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { getCandidateAvatarUrl } from '../../apis/candidate'
import { AppLogo } from '../app-logo'
import { ROLE, type Role } from '../../constants/role.constant'
import { ROUTE } from '../../constants/route.constant'
import { useAuth } from '../../provider/auth-provider'
import { NotificationBell } from '../notification-bell'

const menus: Partial<Record<Role, { label: string; to: string }[]>> = {
  [ROLE.CANDIDATE]: [
    { label: 'Tìm việc', to: ROUTE.CANDIDATE_JOBS },
    { label: 'Hồ sơ cá nhân', to: '/candidate/profile' },
    { label: 'CV của tôi', to: ROUTE.CANDIDATE_CVS },
    { label: 'Việc đã ứng tuyển', to: '/candidate/applications' },
    { label: 'Việc đã lưu', to: '/candidate/saved-jobs' },
  ],
  [ROLE.EMPLOYER]: [
    { label: 'Tin tuyển dụng', to: '/employer/jobs' },
    { label: 'Hồ sơ doanh nghiệp', to: '/employer/company' },
    { label: 'Hồ sơ ứng tuyển', to: '/employer/applications' },
    { label: 'Ứng viên phù hợp', to: '/employer/recommendations' },
  ],
}

export function PortalHeader({ role }: { role: Extract<Role, 1 | 2> }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const accountRef = useRef<HTMLDivElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(Date.now())

  const isCandidate = role === ROLE.CANDIDATE
  const profileRoute = isCandidate ? '/candidate/profile' : '/employer/company'
  const roleLabel = isCandidate ? 'Ứng viên' : 'Nhà tuyển dụng'
  const avatarUrl = isCandidate ? getCandidateAvatarUrl(user?.id, avatarVersion) : null

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    const refreshAvatar = (event: Event) => {
      const detail = (event as CustomEvent<{ timestamp?: number }>).detail
      setAvatarFailed(false)
      setAvatarVersion(detail?.timestamp || Date.now())
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('candidate-avatar-updated', refreshAvatar)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('candidate-avatar-updated', refreshAvatar)
    }
  }, [])

  const handleLogout = async () => {
    setAccountOpen(false)
    await logout()
    navigate(ROUTE.HOME, { replace: true })
  }

  return (
    <header className="portal-header">
      <div className="container portal-header__inner">
        <NavLink className="portal-brand" to={role === ROLE.CANDIDATE ? ROUTE.CANDIDATE_HOME : ROUTE.EMPLOYER_HOME}>
          <AppLogo compact />
        </NavLink>
        <nav className="portal-nav" aria-label="Điều hướng tài khoản">
          {menus[role]?.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="portal-account">
          <NotificationBell />
          <div className="portal-account-menu" ref={accountRef}>
            <button
              type="button"
              className="portal-account__trigger"
              aria-label="Mở menu tài khoản"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <span className={`portal-account__avatar${avatarUrl && !avatarFailed ? ' has-image' : ''}`}>
                {avatarUrl && !avatarFailed
                  ? <img src={avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
                  : user?.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="portal-account__identity">
                <strong>{user?.fullName}</strong>
                <small>{roleLabel}</small>
              </span>
              <i className={`bi bi-chevron-down portal-account__chevron${accountOpen ? ' is-open' : ''}`} aria-hidden="true" />
            </button>
            {accountOpen && <div className="portal-account__dropdown">
              <div className="portal-account__summary">
                <strong>{user?.fullName}</strong>
                <span>{user?.email}</span>
              </div>
              <NavLink to={profileRoute} onClick={() => setAccountOpen(false)}>
                <i className="bi bi-person-circle" />
                <span><strong>Quản lý hồ sơ</strong><small>Cập nhật thông tin và ảnh đại diện</small></span>
              </NavLink>
              <button type="button" className="portal-account__logout" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" />
                <span>Đăng xuất</span>
              </button>
            </div>}
          </div>
        </div>
      </div>
    </header>
  )
}
