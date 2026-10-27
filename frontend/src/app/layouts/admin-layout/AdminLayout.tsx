import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { ADMIN_PERMISSIONS, PERMISSION, type Permission } from '../../constants/permission.constant'
import { ROUTE } from '../../constants/route.constant'
import { useAuth } from '../../provider/auth-provider'
import { hasAnyPermission, hasPermission } from '../../utils/permission'

const adminMenu: { label: string; icon: string; to: string; permission: Permission }[] = [
  { label: 'Tổng quan', icon: 'bi-grid', to: '/admin/dashboard', permission: PERMISSION.ADMIN_STATISTICS_VIEW },
  { label: 'Người dùng', icon: 'bi-people', to: '/admin/users', permission: PERMISSION.ADMIN_USER_MANAGE },
  { label: 'Duyệt doanh nghiệp', icon: 'bi-building-check', to: '/admin/employers', permission: PERMISSION.ADMIN_USER_MANAGE },
  { label: 'Tin tuyển dụng', icon: 'bi-briefcase', to: '/admin/jobs', permission: PERMISSION.ADMIN_JOB_MANAGE },
  { label: 'Danh mục', icon: 'bi-tags', to: '/admin/categories', permission: PERMISSION.ADMIN_CATEGORY_MANAGE },
  { label: 'Báo cáo', icon: 'bi-flag', to: '/admin/reports', permission: PERMISSION.ADMIN_REPORT_MANAGE },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!hasAnyPermission(user?.permissions, ADMIN_PERMISSIONS)) return null

  const handleLogout = async () => {
    await logout()
    navigate(ROUTE.HOME, { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-sidebar__brand" to={ROUTE.ADMIN_HOME}><i className="bi bi-briefcase" /><span>Quản trị hệ thống</span></NavLink>
        <nav aria-label="Điều hướng quản trị">
          {adminMenu.filter((item) => hasPermission(user?.permissions, item.permission)).map((item) => (
            <NavLink key={item.to} to={item.to}><i className={`bi ${item.icon}`} /><span>{item.label}</span></NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__account">
          <strong>{user?.fullName}</strong><span>{user?.email}</span>
          <button type="button" onClick={handleLogout}><i className="bi bi-box-arrow-right" /> Đăng xuất</button>
        </div>
      </aside>
      <main className="admin-content"><Outlet /></main>
    </div>
  )
}
