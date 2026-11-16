import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { adminActions } from '../../modules/admin/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

type ResolutionForm = { status: string; resolution: string; actionTaken: string }

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
    defaultValues: { status: 'PROCESSING' },
  })

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
    reset({ status: 'PROCESSING', resolution: '', actionTaken: '' })
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
                    {report.resolution && <small><strong>Kết quả:</strong> {report.resolution}</small>}
                  </td>
                  <td>{report.entityType ? `${report.entityType} #${report.entityId}` : 'Báo cáo chung'}</td>
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
            <label>
              Trạng thái
              <select {...register('status', { required: true })}>
                {['PROCESSING', 'RESOLVED', 'REJECTED'].map((item) => <option value={item} key={item}>{STATUS_LABELS[item]}</option>)}
              </select>
            </label>
            <label>
              Kết luận
              <textarea {...register('resolution', { required: 'Vui lòng nhập kết quả xử lý.' })} />
            </label>
            {errors.resolution && <small className="text-danger">{errors.resolution.message}</small>}
            <label>
              Hành động đã thực hiện
              <input {...register('actionTaken')} placeholder="Ví dụ: Ẩn tin vi phạm" />
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
