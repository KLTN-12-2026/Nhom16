import { Link, NavLink } from 'react-router-dom'

import { ROUTE } from '../../../../constants/route.constant'

const navigationItems = [
  { label: 'Việc làm', to: ROUTE.JOBS },
  { label: 'Đánh giá CV', to: ROUTE.CV_ANALYSIS },
  { label: 'Ngành nghề', to: ROUTE.CATEGORIES },
  { label: 'Dành cho doanh nghiệp', to: ROUTE.FOR_EMPLOYERS },
];

function Brand() {
  return (
    <Link
      className="brand"
      to="/"
      aria-label="Tuyển Dụng Thông Minh - Trang chủ"
    >
      <span className="brand-mark" aria-hidden="true">
        <i className="bi bi-stars" />
      </span>
      <span className="brand-name">
        Tuyển Dụng <span>Thông Minh</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
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
          <Link className="btn btn-link login-link" to="/auth/login">
            Đăng nhập
          </Link>
          <Link className="btn btn-primary header-cta" to="/auth/register">
            Đăng ký
          </Link>
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
            <Link to="/auth/login">Đăng nhập</Link>
            <Link className="mobile-menu__primary" to="/auth/register">
              Đăng ký tài khoản
            </Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
