import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{ users: number; employers: number; jobs: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:4000/api/admin/metrics', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setMetrics(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="admin-page">
      <span className="eyebrow">Quản trị hệ thống</span>
      <h1>Tổng quan hoạt động</h1>
      <p>Theo dõi người dùng, doanh nghiệp và tình trạng vận hành của nền tảng.</p>

      <div className="admin-metrics">
        <article>
          <div className="d-flex align-items-center justify-content-between">
            <i className="bi bi-people fs-2 text-primary" />
            <Link to="/admin/users" className="small text-decoration-none">Chi tiết &rarr;</Link>
          </div>
          <span className="text-muted">Tổng số người dùng</span>
          <strong className="fs-3">{loading ? '...' : metrics?.users ?? 0}</strong>
        </article>

        <article>
          <div className="d-flex align-items-center justify-content-between">
            <i className="bi bi-building fs-2 text-success" />
            <Link to="/admin/users?roleId=2" className="small text-decoration-none text-success">Chi tiết &rarr;</Link>
          </div>
          <span className="text-muted">Doanh nghiệp đã đăng ký</span>
          <strong className="fs-3">{loading ? '...' : metrics?.employers ?? 0}</strong>
        </article>

        <article>
          <div className="d-flex align-items-center justify-content-between">
            <i className="bi bi-briefcase fs-2 text-warning" />
            <Link to="/jobs" className="small text-decoration-none text-warning">Xem tin &rarr;</Link>
          </div>
          <span className="text-muted">Tin tuyển dụng công khai</span>
          <strong className="fs-3">{loading ? '...' : metrics?.jobs ?? 0}</strong>
        </article>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mt-4">
        <h2 className="h5 fw-bold mb-3">Lối tắt tác vụ quản trị nhanh</h2>
        <div className="d-flex flex-wrap gap-3">
          <Link to="/admin/users" className="btn btn-outline-primary px-3 py-2 rounded-3">
            <i className="bi bi-people me-2" /> Quản lý danh sách người dùng
          </Link>
          <Link to="/jobs" className="btn btn-outline-secondary px-3 py-2 rounded-3">
            <i className="bi bi-briefcase me-2" /> Xem danh sách việc làm công khai
          </Link>
        </div>
      </div>
    </section>
  )
}
