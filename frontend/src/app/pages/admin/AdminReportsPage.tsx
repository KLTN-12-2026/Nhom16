import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { adminActions } from '../../modules/admin/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

type ResolutionForm = { status: string; resolution: string; actionTaken: string; jobAction: string }

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Mới tiếp nhận',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Không vi phạm',
}

const TYPE_LABELS: Record<string, string> = {
  JOB: 'Tin tuyển dụng',
  USER: 'Người dùng',
  COMPANY: 'Doanh nghiệp',
  OTHER: 'Khác',
}

export default function AdminReportsPage() {
  const dispatch = useAppDispatch()
  const { reports, loading, error, message } = useAppSelector((state) => state.admin)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResolutionForm>({
    defaultValues: { status: 'PROCESSING', jobAction: '' },
  })

  const selectedReport = useMemo(
    () => reports.find((item) => item.id === selected) || null,
    [reports, selected],
  )

  useEffect(() => {
    dispatch(adminActions.reportsLoad({}))
  }, [dispatch])

  const summary = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((report) => ['RECEIVED', 'PROCESSING'].includes(report.status)).length,
    resolved: reports.filter((report) => report.status === 'RESOLVED').length,
  }), [reports])

  const load = () => dispatch(adminActions.reportsLoad({ status: statusFilter, reportType: typeFilter.trim() }))

  const submit = handleSubmit((form) => {
    if (!selected) return
    dispatch(adminActions.reportUpdate({ id: selected, ...form }))
    setSelected(null)
    reset({ status: 'PROCESSING', resolution: '', actionTaken: '', jobAction: '' })
  })

  return (
    <section className="admin-page admin-workspace admin-page--operational">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-header__eyebrow">Trung tâm phản hồi</span>
          <h1>Báo cáo người dùng</h1>
          <p>Tiếp nhận, phân loại và lưu vết kết quả xử lý phản ánh trên toàn hệ thống.</p>
        </div>
        <div className="admin-page-header__summary" aria-label="Thống kê báo cáo">
          <span><strong>{summary.total}</strong>Tổng báo cáo</span>
          <span><strong>{summary.pending}</strong>Cần xử lý</span>
          <span><strong>{summary.resolved}</strong>Đã giải quyết</span>
        </div>
      </header>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {message && <div className="admin-alert admin-alert--success">{message}</div>}

      <form className="admin-filter-grid admin-filter-grid--reports" onSubmit={(event) => { event.preventDefault(); load() }}>
        <label className="admin-filter-field">
          <span>Loại báo cáo</span>
          <input value={typeFilter} onChange={(event) => setTypeFilter(event.target.value.toUpperCase())} placeholder="Ví dụ: JOB, USER" />
        </label>
        <label className="admin-filter-field">
          <span>Trạng thái xử lý</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <button className="admin-search-button" disabled={loading} type="submit">
          <i className="bi bi-search" /> {loading ? 'Đang tải...' : 'Áp dụng bộ lọc'}
        </button>
      </form>

      <div className="admin-table-shell">
        <div className="admin-table-shell__heading">
          <div>
            <h2>Danh sách phản ánh</h2>
            <p>{reports.length} báo cáo phù hợp với bộ lọc hiện tại.</p>
          </div>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Loại báo cáo</th>
                <th>Nội dung</th>
                <th>Đối tượng</th>
                <th>Thời gian gửi</th>
                <th>Trạng thái</th>
                <th className="admin-table-actions-column">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <strong className="admin-table-primary">{TYPE_LABELS[report.reportType] || report.reportType}</strong>
                    <small className="admin-table-secondary">Mã #{report.id}</small>
                  </td>
                  <td className="admin-report-content">
                    <span>{report.content}</span>
                    {report.resolution && <small className="d-block mt-1"><strong>Kết quả:</strong> {report.resolution}</small>}
                    {report.actionTaken && <small className="d-block text-success"><strong>Biện pháp:</strong> {report.actionTaken}</small>}
                  </td>
                  <td>
                    {report.targetJob ? (
                      <div>
                        <strong className="admin-table-primary">{report.targetJob.title}</strong>
                        <small className="admin-table-secondary">
                          {report.targetJob.company} · Tin #{report.targetJob.id} ({report.targetJob.status})
                        </small>
                        <div className="d-flex gap-2 mt-1">
                          <Link
                            to={`/jobs/${report.targetJob.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="small fw-bold text-success text-decoration-none"
                          >
                            <i className="bi bi-box-arrow-up-right me-1" />Xem chi tiết tin
                          </Link>
                          <Link
                            to="/admin/jobs"
                            className="small fw-bold text-primary text-decoration-none"
                          >
                            <i className="bi bi-shield-check me-1" />Kiểm duyệt
                          </Link>
                        </div>
                      </div>
                    ) : report.entityType ? (
                      <span>{report.entityType} #{report.entityId}</span>
                    ) : (
                      <span>Báo cáo chung</span>
                    )}
                  </td>
                  <td>{new Date(report.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <span className={`admin-status admin-status--${report.status.toLowerCase()}`}>
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                  </td>
                  <td className="admin-table-actions-column">
                    <button type="button" className="admin-table-action-button" onClick={() => setSelected(report.id)}>
                      <i className="bi bi-pencil-square" /> Xử lý
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !reports.length && (
                <tr><td colSpan={6} className="admin-table-empty">Không có báo cáo phù hợp với bộ lọc.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="admin-modal-backdrop">
          <form className="admin-modal" onSubmit={submit}>
            <button className="admin-modal__close" type="button" onClick={() => setSelected(null)}>×</button>
            <span className="admin-page-header__eyebrow">Kết quả xử lý</span>
            <h2>Cập nhật báo cáo #{selected}</h2>
            {selectedReport?.targetJob && (
              <div className="p-2 rounded-3 border bg-light small">
                <div><strong>Đối tượng:</strong> {selectedReport.targetJob.title} (Tin #{selectedReport.targetJob.id})</div>
                <div className="text-muted">Doanh nghiệp: {selectedReport.targetJob.company} · Trạng thái hiện tại: <strong>{selectedReport.targetJob.status}</strong></div>
                <div className="mt-1"><strong>Nội dung phản ánh:</strong> “{selectedReport.content}”</div>
              </div>
            )}
            <label>
              Trạng thái
              <select {...register('status', { required: true })}>
                {['PROCESSING', 'RESOLVED', 'REJECTED'].map((item) => <option value={item} key={item}>{STATUS_LABELS[item]}</option>)}
              </select>
            </label>
            {selectedReport?.targetJob && (
              <label>
                Thực hiện biện pháp với tin tuyển dụng (trong phạm vi quyền)
                <select {...register('jobAction')}>
                  <option value="">Không thay đổi trạng thái tin</option>
                  <option value="HIDE">Tạm ẩn tin tuyển dụng vi phạm (HIDE)</option>
                  <option value="REMOVE">Đóng / Gỡ tin tuyển dụng vi phạm (CLOSED)</option>
                  <option value="RESTORE">Khôi phục hiển thị tin (ACTIVE)</option>
                </select>
              </label>
            )}
            <label>
              Kết luận / Phản hồi cho người báo cáo
              <textarea {...register('resolution', { required: 'Vui lòng nhập kết quả xử lý.' })} placeholder="Nhập kết luận xử lý (tối thiểu 5 ký tự)..." />
            </label>
            {errors.resolution && <small className="text-danger">{errors.resolution.message}</small>}
            <label>
              Ghi chú hành động bổ sung
              <input {...register('actionTaken')} placeholder="Ví dụ: Đã nhắc nhở doanh nghiệp cập nhật lại thông tin" />
            </label>
            <div>
              <button type="button" onClick={() => setSelected(null)}>Hủy</button>
              <button type="submit">Lưu kết quả</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
