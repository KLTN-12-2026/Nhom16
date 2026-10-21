const navigationItems = [
  { label: 'Việc làm', href: '#featured-jobs' },
  { label: 'Phân tích CV', href: '#ai-workflow' },
  { label: 'Ngành nghề', href: '#categories' },
  { label: 'Dành cho doanh nghiệp', href: '#employer' },
]

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="TuyenDungAI - Trang chủ">
      <span className="brand-mark" aria-hidden="true"><i className="bi bi-stars" /></span>
      <span className="brand-name">TuyenDung<span>AI</span></span>
    </a>
  )
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="container header-inner" aria-label="Điều hướng chính">
        <Brand />
        <div className="desktop-navigation">
          {navigationItems.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </div>
        <div className="header-actions">
          <a className="btn btn-link login-link" href="#login">Đăng nhập</a>
          <a className="btn btn-primary header-cta" href="#register">Đăng ký</a>
        </div>
        <details className="mobile-navigation">
          <summary aria-label="Mở menu điều hướng"><span className="menu-icon" aria-hidden="true" /></summary>
          <div className="mobile-menu">
            {navigationItems.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
            <a href="#login">Đăng nhập</a>
            <a className="mobile-menu__primary" href="#register">Đăng ký tài khoản</a>
          </div>
        </details>
      </nav>
    </header>
  )
}
