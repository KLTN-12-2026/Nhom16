import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminActions } from '../../modules/admin/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch()
  const { dashboard, loading, error } = useAppSelector((state) => state.admin)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(() => { dispatch(adminActions.dashboardLoad({})) }, [dispatch])
  const metrics = [
    ['Người dùng', dashboard?.totals.users ?? 0, 'bi-people', '/admin/users'],
    ['Doanh nghiệp', dashboard?.totals.employers ?? 0, 'bi-building', '/admin/employers'],
    ['Tin tuyển dụng', dashboard?.totals.jobs ?? 0, 'bi-briefcase', '/admin/jobs'],
    ['Lượt ứng tuyển', dashboard?.totals.applications ?? 0, 'bi-send-check', '/admin/reports'],
  ] as const
  return <section className="admin-page admin-workspace">
    <header className="admin-hero"><div><span className="eyebrow">Trung tâm vận hành</span><h1>Tổng quan hệ thống</h1><p>Số liệu thực tế, không hiển thị thông tin định danh người dùng.</p></div><div className="admin-date-filter"><label>Từ ngày<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Đến ngày<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label><button onClick={() => dispatch(adminActions.dashboardLoad({ from, to }))}>Áp dụng</button></div></header>
    {error && <div className="admin-alert admin-alert--error">{error}</div>}
    <div className="admin-kpi-grid">{metrics.map(([label, value, icon, path]) => <Link to={path} className="admin-kpi" key={label}><i className={`bi ${icon}`} /><span>{label}</span><strong>{loading ? '…' : value.toLocaleString('vi-VN')}</strong><small>Xem chi tiết <i className="bi bi-arrow-right" /></small></Link>)}</div>
    <div className="admin-panel"><div className="admin-panel__heading"><div><span className="eyebrow">Phân bổ trạng thái</span><h2>Nhịp vận hành</h2></div><small>Cập nhật: {dashboard?.updatedAt ? new Date(dashboard.updatedAt).toLocaleString('vi-VN') : '—'}</small></div><div className="admin-breakdowns">{(['users', 'jobs', 'applications'] as const).map((group) => <article key={group}><h3>{group === 'users' ? 'Tài khoản' : group === 'jobs' ? 'Tin tuyển dụng' : 'Ứng tuyển'}</h3>{Object.entries(dashboard?.breakdowns[group] || {}).map(([status, count]) => <div key={status}><span>{status}</span><strong>{count}</strong></div>)}{!Object.keys(dashboard?.breakdowns[group] || {}).length && <p>Chưa có dữ liệu.</p>}</article>)}</div></div>
  </section>
}
