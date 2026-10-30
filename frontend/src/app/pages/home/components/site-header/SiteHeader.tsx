import { Link, NavLink } from 'react-router-dom'

import { AppLogo } from '../../../../components/app-logo'
import { ROLE } from '../../../../constants/role.constant'
import { ROUTE } from '../../../../constants/route.constant'
import { useAuth } from '../../../../provider/auth-provider'

const navigationItems = [
  { label: 'Việc làm', to: ROUTE.JOBS },
  { label: 'Đánh giá CV', to: ROUTE.CV_ANALYSIS },
  { label: 'Ngành nghề', to: ROUTE.CATEGORIES },
  { label: 'Dành cho doanh nghiệp', to: ROUTE.FOR_EMPLOYERS },
]

function Brand() {
  return (
    <Link
      className="brand"
      to="/"
      aria-label="TopCV - Trang chủ"
    >
      <AppLogo tagline />
    </Link>
  )
}

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth()

  const portalRoute = user?.role === ROLE.ADMIN
    ? '/admin/dashboard'
    : user?.role === ROLE.EMPLOYER
      ? '/employer'
      : '/candidate'

  return (
    <header className="site-header">
      <nav className="container header-inner" aria-label="Điều hướng chính">
        <Brand />
        <div className="desktop-navigation">
          {navigationItems.map((item) => (
            <NavLink to={item.to} key={item.to}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="header-actions">
          {isAuthenticated && user ? (
            <div className="d-flex align-items-center gap-3">
              <Link className="btn btn-outline-primary rounded-pill px-3 py-1 text-decoration-none" to={portalRoute}>
                <i className="bi bi-speedometer2 me-1" /> Không gian làm việc
              </Link>
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                  style={{ width: 34, height: 34, fontSize: '0.9rem' }}
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="fw-semibold text-dark small d-none d-lg-inline">
                  {user.fullName}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-link text-secondary text-decoration-none p-0"
                onClick={logout}
                title="Đăng xuất"
              >
                <i className="bi bi-box-arrow-right fs-5 text-danger" />
              </button>
            </div>
          ) : (
            <>
              <Link className="btn btn-link login-link" to="/auth/login">
                Đăng nhập
              </Link>
              <Link className="btn btn-primary header-cta" to="/auth/register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
        <details className="mobile-navigation">
          <summary aria-label="Mở menu điều hướng">
            <span className="menu-icon" aria-hidden="true" />
          </summary>
          <div className="mobile-menu">
            {navigationItems.map((item) => (
              <NavLink to={item.to} key={item.to}>
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated && user ? (
              <>
                <Link to={portalRoute}>Vào không gian làm việc ({user.fullName})</Link>
                <button
                  type="button"
                  className="btn btn-link text-start text-danger p-0 mt-2"
                  onClick={logout}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/login">Đăng nhập</Link>
                <Link className="mobile-menu__primary" to="/auth/register">
                  Đăng ký tài khoản
                </Link>
              </>
            )}
          </div>
        </details>
      </nav>
    </header>
  )
}
