import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { adminActions } from '../../modules/admin/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

type ModerationForm = { reason: string }
type ModerationAction = 'APPROVE' | 'HIDE' | 'RESTORE' | 'REMOVE'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp', ACTIVE: 'Đang hiển thị', HIDDEN: 'Đang ẩn', CLOSED: 'Đã đóng', EXPIRED: 'Hết hạn',
}
const ACTION_LABELS: Record<ModerationAction, string> = {
  APPROVE: 'Phê duyệt', HIDE: 'Ẩn tin', RESTORE: 'Khôi phục', REMOVE: 'Đóng tin',
}

export default function AdminJobsPage() {
  const dispatch = useAppDispatch()
  const { jobs, auditLogs, loading, error, message } = useAppSelector((state) => state.admin)
  const [filters, setFilters] = useState({ search: '', company: '', status: '', from: '', to: '' })
  const [selected, setSelected] = useState<number | null>(null)
  const [historyJob, setHistoryJob] = useState<number | null>(null)
  const [action, setAction] = useState<ModerationAction | ''>('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ModerationForm>()

  useEffect(() => { dispatch(adminActions.jobsLoad({})) }, [dispatch])

  const summary = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter((job) => job.status === 'ACTIVE').length,
    hidden: jobs.filter((job) => job.status === 'HIDDEN').length,
  }), [jobs])

  const submit = handleSubmit(({ reason }) => {
    if (selected && action) {
      dispatch(adminActions.jobModerate({ id: selected, action, reason }))
      setSelected(null); setAction(''); reset()
    }
  })

  const updateFilter = (name: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [name]: value }))
  const getActions = (status: string): ModerationAction[] => {
    if (['CLOSED', 'EXPIRED'].includes(status)) return []
    if (status === 'ACTIVE') return ['HIDE', 'REMOVE']
    if (status === 'HIDDEN') return ['RESTORE', 'APPROVE', 'REMOVE']
    return ['APPROVE', 'REMOVE']
  }

  return <section className="admin-page admin-workspace admin-page--operational">
    <header className="admin-page-header">
      <div><span className="admin-page-header__eyebrow">An toàn nội dung</span><h1>Kiểm duyệt tin tuyển dụng</h1><p>Phê duyệt, ẩn hoặc đóng tin với lý do minh bạch và lịch sử đầy đủ.</p></div>
      <div className="admin-page-header__summary"><span><strong>{summary.total}</strong>Tổng tin</span><span><strong>{summary.active}</strong>Hiển thị</span><span><strong>{summary.hidden}</strong>Đang ẩn</span></div>
    </header>
    {error && <div className="admin-alert admin-alert--error">{error}</div>}{message && <div className="admin-alert admin-alert--success">{message}</div>}
    <form className="admin-filter-grid" onSubmit={(event) => { event.preventDefault(); dispatch(adminActions.jobsLoad(filters)) }}>
      <label className="admin-filter-field admin-filter-field--wide"><span>Từ khóa</span><input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Chức danh hoặc từ khóa" /></label>
      <label className="admin-filter-field"><span>Doanh nghiệp</span><input value={filters.company} onChange={(e) => updateFilter('company', e.target.value)} placeholder="Tên doanh nghiệp" /></label>
      <label className="admin-filter-field"><span>Trạng thái</span><select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="admin-filter-field"><span>Từ ngày</span><input type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} /></label>
      <label className="admin-filter-field"><span>Đến ngày</span><input type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} /></label>
      <button className="admin-search-button" type="submit"><i className="bi bi-search" /> Tìm kiếm</button>
    </form>
    <div className="admin-table-shell"><div className="admin-table-shell__heading"><div><h2>Danh sách tin tuyển dụng</h2><p>{loading ? 'Đang tải dữ liệu…' : `${jobs.length} kết quả phù hợp`}</p></div></div><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>Tin tuyển dụng</th><th>Doanh nghiệp</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>
      {jobs.map((job) => <tr key={job.id}><td><div className="admin-table-primary"><span className="admin-table-avatar">{(job.company || 'T').slice(0, 2).toUpperCase()}</span><div><strong>{job.title}</strong><small><i className="bi bi-geo-alt" /> {job.location || 'Chưa cập nhật'}</small></div></div></td><td>{job.employerProfile?.companyName || job.company || 'Chưa cập nhật'}</td><td><span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{STATUS_LABELS[job.status] || job.status}</span></td><td>{new Date(job.createdAt).toLocaleDateString('vi-VN')}</td><td><div className="admin-row-actions"><button type="button" onClick={() => { setHistoryJob(job.id); dispatch(adminActions.auditLogsLoad({ entityType: 'JOB', entityId: job.id })) }}><i className="bi bi-clock-history" /> Lịch sử</button>{getActions(job.status).map((value) => <button type="button" key={value} className={`admin-action--${value.toLowerCase()}`} onClick={() => { setSelected(job.id); setAction(value) }}>{ACTION_LABELS[value]}</button>)}</div></td></tr>)}
      {!loading && !jobs.length && <tr><td colSpan={5}><div className="admin-table-empty">Không có tin tuyển dụng phù hợp với bộ lọc.</div></td></tr>}
    </tbody></table></div></div>
    {selected && <div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={submit}><button className="admin-modal__close" type="button" onClick={() => setSelected(null)}>×</button><span className="eyebrow">Xác nhận kiểm duyệt</span><h2>{action ? ACTION_LABELS[action] : ''}</h2><p>Lý do sẽ được lưu vào nhật ký và gửi đến doanh nghiệp.</p><textarea {...register('reason', { required: 'Vui lòng nhập lý do.', minLength: { value: 5, message: 'Lý do cần ít nhất 5 ký tự.' } })} placeholder="Nhập lý do xử lý…" />{errors.reason && <small className="text-danger">{errors.reason.message}</small>}<div><button type="button" onClick={() => setSelected(null)}>Hủy</button><button type="submit">Xác nhận</button></div></form></div>}
    {historyJob && <div className="admin-modal-backdrop"><section className="admin-modal admin-audit-modal"><button className="admin-modal__close" type="button" onClick={() => setHistoryJob(null)}>×</button><span className="eyebrow">Nhật ký kiểm duyệt</span><h2>Tin tuyển dụng #{historyJob}</h2>{!loading && !auditLogs.length && <p>Chưa có thao tác kiểm duyệt nào.</p>}<div className="admin-audit-list">{auditLogs.map((log) => <article key={log.id}><i className="bi bi-shield-check" /><div><strong>{log.action.replace('JOB_', '')}</strong><time>{new Date(log.createdAt).toLocaleString('vi-VN')}</time><p>{log.reason || 'Không có ghi chú'}</p></div></article>)}</div></section></div>}
  </section>
}
