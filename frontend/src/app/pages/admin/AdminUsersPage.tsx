import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../provider/auth-provider'

interface UserItem {
  id: number
  email: string
  fullName: string
  status: string
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  roles: Array<{ id: number; name: string; code: string }>
  employerProfile?: {
    companyName: string
    taxCode: string
  }
}

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search.trim()) params.append('search', search.trim())
      if (roleFilter) params.append('roleId', roleFilter)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`http://localhost:4000/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success && result.data) {
        setUsers(result.data.users || [])
        setTotalPages(result.data.totalPages || 1)
        setTotalUsers(result.data.total || 0)
      }
    } catch {
      setFeedback({ type: 'error', message: 'Không thể tải danh sách người dùng.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, statusFilter])

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    const confirmMessage = user.status === 'ACTIVE'
      ? `Bạn có chắc chắn muốn KHÓA tài khoản ${user.email}?`
      : `Bạn có muốn MỞ KHÓA tài khoản ${user.email}?`

    if (!window.confirm(confirmMessage)) return

    setActionLoading(user.id)
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Cập nhật trạng thái thất bại.')

      setFeedback({
        type: 'success',
        message: newStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản thành công.' : 'Đã khóa tài khoản thành công.',
      })
      fetchUsers()
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (user: UserItem, newRoleId: number) => {
    const currentRoleId = user.roles?.[0]?.id || 1
    if (newRoleId === currentRoleId) return

    const roleName = newRoleId === 3 ? 'Quản trị viên' : newRoleId === 2 ? 'Doanh nghiệp' : 'Ứng viên'
    if (!window.confirm(`Bạn có chắc muốn đổi vai trò của ${user.email} sang "${roleName}"?`)) {
      fetchUsers()
      return
    }

    setActionLoading(user.id)
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roleId: newRoleId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Chuyển vai trò thất bại.')

      setFeedback({ type: 'success', message: 'Đã cập nhật vai trò người dùng thành công.' })
      fetchUsers()
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message })
      fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Hoạt động</span>
      case 'LOCKED':
        return <span className="badge bg-danger text-white">Bị khóa</span>
      case 'PENDING_VERIFICATION':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Chờ xác minh</span>
      default:
        return <span className="badge bg-light text-dark border">{status}</span>
    }
  }

  return (
    <section className="container-fluid py-2">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span>
          <h1 className="h3 fw-bold mb-1">Quản lý tài khoản người dùng</h1>
          <p className="text-muted small mb-0">
            Theo dõi, phân quyền và kiểm soát quyền truy cập tài khoản trên hệ thống.
          </p>
        </div>
        <div className="badge bg-light text-dark border px-3 py-2 fs-6 rounded-pill">
          Tổng cộng: <strong>{totalUsers}</strong> tài khoản
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
          <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Tìm theo email hoặc họ tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="1">Ứng viên</option>
              <option value="2">Doanh nghiệp</option>
              <option value="3">Quản trị viên</option>
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
              <option value="PENDING_VERIFICATION">Chờ xác minh</option>
            </select>
          </div>

          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              Lọc kết quả
            </button>
          </div>
        </form>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: 55 }} className="text-center">STT</th>
                <th scope="col" style={{ width: 65 }}>ID</th>
                <th scope="col">Người dùng</th>
                <th scope="col" style={{ minWidth: 150 }}>Vai trò</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Ngày tạo</th>
                <th scope="col" className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                users.map((u, index) => {
                  const roleId = u.roles?.[0]?.id || 1
                  const isCurrentAdmin = currentAdmin?.id === u.id
                  const stt = (page - 1) * 10 + index + 1

                  // Custom styling for clean role selector (no ugly square border)
                  const roleStyle = roleId === 3
                    ? { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
                    : roleId === 2
                      ? { bg: '#e0f2fe', color: '#075985', border: '#bae6fd' }
                      : { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' }

                  return (
                    <tr key={u.id}>
                      <td className="text-center fw-bold text-secondary">{stt}</td>
                      <td className="fw-semibold text-muted">#{u.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                            style={{ width: 36, height: 36 }}
                          >
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">
                              {u.fullName}
                              {isCurrentAdmin && <span className="badge bg-info-subtle text-info ms-2">Bạn</span>}
                            </div>
                            <small className="text-muted">{u.email}</small>
                            {u.employerProfile?.companyName && (
                              <div className="small text-secondary"><i className="bi bi-building me-1" />{u.employerProfile.companyName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm fw-semibold rounded-pill shadow-none"
                          style={{
                            width: 'auto',
                            minWidth: 140,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0.35rem 1.75rem 0.35rem 0.85rem',
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.color,
                            borderColor: roleStyle.border,
                          }}
                          value={roleId}
                          disabled={actionLoading === u.id}
                          onChange={(e) => handleChangeRole(u, parseInt(e.target.value))}
                          title="Bấm để thay đổi vai trò"
                        >
                          <option value="1">Ứng viên</option>
                          <option value="2">Doanh nghiệp</option>
                          <option value="3">Quản trị viên</option>
                        </select>
                      </td>
                      <td>{getStatusBadge(u.status)}</td>
                      <td>
                        <small className="text-muted">
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td className="text-end">
                        {isCurrentAdmin ? (
                          <span
                            className="badge bg-light text-muted border px-2 py-1"
                            title="Bạn không thể tự khóa tài khoản của chính mình"
                          >
                            <i className="bi bi-shield-lock me-1" /> Không thể tự khóa
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'} rounded-pill px-3`}
                            disabled={actionLoading === u.id}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {actionLoading === u.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" />
                            ) : u.status === 'ACTIVE' ? (
                              <>
                                <i className="bi bi-lock me-1" /> Khóa
                              </>
                            ) : (
                              <>
                                <i className="bi bi-unlock me-1" /> Mở khóa
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between p-3 border-top bg-light">
            <small className="text-muted">
              Trang {page} / {totalPages}
            </small>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
