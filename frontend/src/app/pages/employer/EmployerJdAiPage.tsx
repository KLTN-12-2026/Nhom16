import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { confirmJdAnalysisApi, updateJdAnalysisApi, type JdAnalysis } from '../../apis/ai'
import { ApiClientError } from '../../apis/fetch-api'
import type { JobData } from '../../apis/job'
import { listEmployerJobsApi } from '../../apis/recruitment'
import { recruitmentAiActions } from '../../modules/recruitment-ai/redux'
import type { AppDispatch, RootState } from '../../store'
import '../../../styles/recruitment-ai.scss'

type Form = { jobId: string }
type Section = [keyof JdAnalysis, string, string, string]
type Notice = { type: 'success' | 'error'; message: string } | null
type PendingAction = 'save' | 'confirm' | null

const sections: Section[] = [
  ['responsibilities', 'Trách nhiệm chính', 'bi-list-check', 'Những đầu việc ứng viên sẽ đảm nhiệm'],
  ['requiredSkills', 'Kỹ năng bắt buộc', 'bi-shield-check', 'Năng lực cần có để đáp ứng vị trí'],
  ['preferredSkills', 'Kỹ năng ưu tiên', 'bi-stars', 'Điểm cộng giúp ứng viên nổi bật'],
  ['experienceRequirements', 'Kinh nghiệm', 'bi-briefcase', 'Số năm và phạm vi kinh nghiệm'],
  ['educationRequirements', 'Học vấn', 'bi-mortarboard', 'Bằng cấp hoặc nền tảng đào tạo'],
  ['mandatoryRequirements', 'Điều kiện bắt buộc', 'bi-exclamation-diamond', 'Điều kiện không thể thay thế'],
  ['keywords', 'Từ khóa tuyển dụng', 'bi-tags', 'Từ khóa dùng cho đối chiếu CV'],
]

const statusText: Record<JdAnalysis['status'], string> = {
  PENDING: 'Đang chờ xử lý', PROCESSING: 'AI đang phân tích', COMPLETED: 'Đã hoàn tất', FAILED: 'Phân tích thất bại',
}

export default function EmployerJdAiPage() {
  const dispatch = useDispatch<AppDispatch>()
  const ai = useSelector((state: RootState) => state.recruitmentAi)
  const [jobs, setJobs] = useState<JobData[]>([])
  const [selected, setSelected] = useState<JdAnalysis | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const { register, handleSubmit, watch } = useForm<Form>()
  const selectedJobId = Number(watch('jobId'))

  useEffect(() => {
    void listEmployerJobsApi().then(response => setJobs(response.data))
    dispatch(recruitmentAiActions.listJd())
  }, [dispatch])

  const current = useMemo(
    () => ai.jdAnalyses.find(item => item.id === selected?.id) || ai.jdAnalyses.find(item => item.jobId === selectedJobId) || ai.jdAnalyses[0] || null,
    [ai.jdAnalyses, selected?.id, selectedJobId],
  )
  useEffect(() => { if (current && current !== selected) setSelected(current) }, [current, selected])

  const completedCount = ai.jdAnalyses.filter(item => item.status === 'COMPLETED').length
  const confirmedCount = ai.jdAnalyses.filter(item => item.isConfirmed).length
  const fieldCount = selected ? sections.reduce((sum, [key]) => sum + (Array.isArray(selected[key]) ? (selected[key] as string[]).length : 0), 0) : 0
  const run = ({ jobId }: Form) => { setNotice(null); dispatch(recruitmentAiActions.requestJd(Number(jobId), false)) }
  const retry = () => { if (selected) { setNotice(null); dispatch(recruitmentAiActions.requestJd(selected.jobId, true)) } }
  const remove = () => {
    if (!selected || !window.confirm(`Xóa phiên phân tích "${selected.job?.title || selected.title || `#${selected.id}`}"?`)) return
    dispatch(recruitmentAiActions.deleteJd(selected.id))
    setSelected(null)
    setNotice({ type: 'success', message: 'Đã xóa phiên phân tích khỏi lịch sử.' })
  }
  const changeList = (key: keyof JdAnalysis, value: string) => setSelected(previous => previous ? { ...previous, [key]: value.split('\n').map(item => item.trim()).filter(Boolean) } : previous)
  const syncAnalysis = (analysis: JdAnalysis) => {
    const next = { ...selected, ...analysis, job: analysis.job || selected?.job } as JdAnalysis
    dispatch(recruitmentAiActions.syncJd(next))
    setSelected(next)
  }
  const getErrorMessage = (cause: unknown, fallback: string) => cause instanceof ApiClientError ? cause.message : fallback
  const save = async () => {
    if (!selected) return
    setPendingAction('save')
    setNotice(null)
    try {
      const response = await updateJdAnalysisApi(selected.id, selected)
      syncAnalysis(response.data)
      setNotice({ type: 'success', message: 'Đã lưu bản hiệu chỉnh. Hãy xác nhận khi nội dung đã chính xác.' })
    } catch (cause) {
      setNotice({ type: 'error', message: getErrorMessage(cause, 'Không thể lưu bản hiệu chỉnh. Vui lòng thử lại.') })
    } finally {
      setPendingAction(null)
    }
  }
  const confirm = async () => {
    if (!selected) return
    setPendingAction('confirm')
    setNotice(null)
    try {
      const response = await confirmJdAnalysisApi(selected.id)
      syncAnalysis(response.data)
      setNotice({ type: 'success', message: 'Đã xác nhận cấu trúc JD để dùng cho đối chiếu CV.' })
    } catch (cause) {
      setNotice({ type: 'error', message: getErrorMessage(cause, 'Không thể xác nhận kết quả. Vui lòng thử lại.') })
    } finally {
      setPendingAction(null)
    }
  }

  return <main className="container ai-studio">
    <header className="ai-studio__header">
      <div><span className="ai-studio__eyebrow"><i className="bi bi-stars" /> AI Recruitment Workspace</span><h1>Phân tích JD thông minh</h1><p>Chuẩn hóa nội dung tuyển dụng thành dữ liệu có thể kiểm tra, hiệu chỉnh và dùng để đối chiếu CV.</p></div>
      <div className="ai-studio__trust"><i className="bi bi-database-lock" /><span><strong>Dữ liệu nội bộ</strong>Không truy cập hoặc bổ sung dữ liệu bên ngoài</span></div>
    </header>

    <section className="ai-metrics" aria-label="Tổng quan phân tích JD">
      <article><i className="bi bi-file-earmark-text" /><span><small>Tin tuyển dụng</small><strong>{jobs.length}</strong></span></article>
      <article><i className="bi bi-check2-circle" /><span><small>Đã phân tích</small><strong>{completedCount}</strong></span></article>
      <article><i className="bi bi-patch-check" /><span><small>Đã xác nhận</small><strong>{confirmedCount}</strong></span></article>
      <article><i className="bi bi-lightning-charge" /><span><small>Trạng thái AI</small><strong>{ai.processing ? 'Đang chạy' : 'Sẵn sàng'}</strong></span></article>
    </section>

    <section className="ai-launcher">
      <div className="ai-launcher__intro"><span>01</span><div><strong>Chọn tin tuyển dụng</strong><small>AI chỉ đọc nội dung JD đã lưu trong hệ thống</small></div></div>
      <form onSubmit={handleSubmit(run)}><label><span className="visually-hidden">Chọn tin cần phân tích</span><select {...register('jobId', { required: true })}><option value="">Chọn một tin tuyển dụng...</option>{jobs.map(job => <option key={job.id} value={job.id}>{job.title} · {job.status}</option>)}</select></label><button disabled={ai.processing}><i className={`bi ${ai.processing ? 'bi-arrow-repeat ai-spin' : 'bi-cpu'}`} />{ai.processing ? 'Đang phân tích' : 'Phân tích bằng AI'}</button></form>
    </section>

    {ai.error && <div className="ai-feedback ai-feedback--error" role="alert"><i className="bi bi-exclamation-octagon" /><div><strong>Không thể bắt đầu phân tích</strong><span>{ai.error}</span></div><button onClick={() => selected ? retry() : dispatch(recruitmentAiActions.listJd())}>Thử lại</button></div>}
    {notice && !selected && <div className={`ai-feedback ai-feedback--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}><i className={`bi ${notice.type === 'error' ? 'bi-exclamation-octagon' : 'bi-check-circle'}`} /><span>{notice.message}</span></div>}

    <div className="ai-studio__workspace">
      <aside className="ai-runs">
        <header><div><span>Lịch sử</span><strong>{ai.jdAnalyses.length} phiên phân tích</strong></div><button title="Làm mới" onClick={() => dispatch(recruitmentAiActions.listJd())}><i className="bi bi-arrow-clockwise" /></button></header>
        {ai.loading ? <div className="ai-runs__loading"><span /><span /><span /></div> : ai.jdAnalyses.length === 0 ? <div className="ai-runs__empty"><i className="bi bi-inbox" /><span>Chưa có phiên phân tích</span></div> : ai.jdAnalyses.map(item => <button className={selected?.id === item.id ? 'is-active' : ''} key={item.id} onClick={() => setSelected(item)}><span className={`ai-run-icon is-${item.status.toLowerCase()}`}><i className={`bi ${item.status === 'COMPLETED' ? 'bi-check2' : item.status === 'FAILED' ? 'bi-x' : 'bi-hourglass-split'}`} /></span><span><strong>{item.job?.title || item.title || `JD #${item.jobId}`}</strong><small>Phiên bản {item.analysisVersion} · {statusText[item.status]}</small></span><i className="bi bi-chevron-right" /></button>)}
      </aside>

      <section className="ai-editor">
        {!selected ? <div className="ai-editor__empty"><span><i className="bi bi-stars" /></span><h2>Sẵn sàng chuẩn hóa JD</h2><p>Chọn một tin tuyển dụng ở phía trên để tạo bản phân tích có cấu trúc.</p></div> : <>
          <header className="ai-editor__header"><div><span className={`ai-pill is-${selected.status.toLowerCase()}`}><i className="bi bi-circle-fill" />{statusText[selected.status]}</span><h2>{selected.title || selected.job?.title}</h2><p>Phiên bản {selected.analysisVersion} · {fieldCount} dữ kiện được trích xuất</p></div><div className="ai-editor__actions">{selected.status === 'COMPLETED' && <><button onClick={save} disabled={pendingAction !== null}><i className={`bi ${pendingAction === 'save' ? 'bi-arrow-repeat ai-spin' : 'bi-cloud-check'}`} /> {pendingAction === 'save' ? 'Đang lưu...' : 'Lưu chỉnh sửa'}</button><button className="is-primary" onClick={confirm} disabled={pendingAction !== null || selected.isConfirmed}><i className={`bi ${pendingAction === 'confirm' ? 'bi-arrow-repeat ai-spin' : 'bi-patch-check'}`} /> {pendingAction === 'confirm' ? 'Đang xác nhận...' : selected.isConfirmed ? 'Đã xác nhận' : 'Xác nhận kết quả'}</button><button className="is-danger" onClick={remove} disabled={pendingAction !== null}><i className="bi bi-trash3" /> Xóa phiên</button></>}</div></header>
          {notice && <div className={`ai-feedback ai-editor__notice ai-feedback--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'} aria-live="polite"><i className={`bi ${notice.type === 'error' ? 'bi-exclamation-octagon' : 'bi-check-circle'}`} /><div><strong>{notice.type === 'error' ? 'Thao tác chưa hoàn tất' : 'Cập nhật thành công'}</strong><span>{notice.message}</span></div></div>}
          {['PENDING', 'PROCESSING'].includes(selected.status) && <div className="ai-progress"><span className="ai-progress__visual"><i className="bi bi-cpu" /></span><div><strong>{selected.status === 'PENDING' ? 'Đang chờ AI worker tiếp nhận' : 'AI đang đọc và phân loại nội dung JD'}</strong><p>Quá trình thường mất từ 10–60 giây. Bạn có thể rời trang và quay lại sau.</p><span className="ai-progress__bar"><i /></span></div></div>}
          {selected.status === 'FAILED' && <div className="ai-feedback ai-feedback--error"><i className="bi bi-exclamation-octagon" /><div><strong>Phiên phân tích thất bại</strong><span>{selected.errorMessage || 'Không thể xử lý JD ở thời điểm hiện tại.'}</span></div><span className="ai-feedback__actions"><button onClick={retry}>Phân tích lại</button><button className="is-danger" onClick={remove}><i className="bi bi-trash3" /> Xóa</button></span></div>}
          {selected.status === 'COMPLETED' && <div className="ai-editor__content"><label className="ai-summary-field"><span><i className="bi bi-card-text" /> Tóm tắt vị trí</span><textarea value={selected.summary || ''} onChange={event => setSelected({ ...selected, summary: event.target.value })} placeholder="Tóm tắt ngắn gọn mục tiêu của vị trí" /></label><div className="ai-section-grid">{sections.map(([key, title, icon, description]) => <label key={String(key)}><header><i className={`bi ${icon}`} /><span><strong>{title}</strong><small>{description}</small></span><em>{Array.isArray(selected[key]) ? (selected[key] as string[]).length : 0}</em></header><textarea value={Array.isArray(selected[key]) ? (selected[key] as string[]).join('\n') : ''} onChange={event => changeList(key, event.target.value)} placeholder="Mỗi nội dung một dòng" /></label>)}</div></div>}
        </>}
      </section>
    </div>
  </main>
}
