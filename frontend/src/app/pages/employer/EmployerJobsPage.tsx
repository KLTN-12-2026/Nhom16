import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import type { JobData } from '../../apis/job'
import { changeEmployerJobStatusApi, cloneEmployerJobApi } from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

const statusMeta: Record<string, { label: string; icon: string }> = {
  ACTIVE: { label: 'Đang tuyển', icon: 'bi-broadcast-pin' },
  DRAFT: { label: 'Bản nháp', icon: 'bi-pencil-square' },
  HIDDEN: { label: 'Đang ẩn', icon: 'bi-eye-slash' },
  CLOSED: { label: 'Đã đóng', icon: 'bi-lock' },
  EXPIRED: { label: 'Hết hạn', icon: 'bi-calendar-x' },
}

interface FilterForm { search: string; status: string }

const daysUntil = (deadline: string) => Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)

export default function EmployerJobsPage() {
  const dispatch = useAppDispatch()
  const { employerJobs: jobs, error, loading } = useAppSelector((state) => state.recruitment)
  const { register, watch, reset } = useForm<FilterForm>({ defaultValues: { search: '', status: '' } })
  const [busyId, setBusyId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const search = watch('search').trim().toLowerCase()
  const status = watch('status')
  useEffect(() => { dispatch(recruitmentActions.employerJobsLoad()) }, [dispatch])

  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter((job) => job.status === 'ACTIVE').length,
    draft: jobs.filter((job) => job.status === 'DRAFT').length,
    attention: jobs.filter((job) => ['ACTIVE', 'HIDDEN'].includes(job.status) && daysUntil(job.deadline) <= 7).length,
  }), [jobs])

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const matchesStatus = !status || job.status === status
    const matchesSearch = !search || `${job.title} ${job.location} ${job.category?.name || ''}`.toLowerCase().includes(search)
    return matchesStatus && matchesSearch
  }), [jobs, search, status])

  const act = async (job: JobData, action: 'publish' | 'hide' | 'close' | 'clone') => {
    setBusyId(job.id)
    setFeedback('')
    try {
      await (action === 'clone' ? cloneEmployerJobApi(job.id) : changeEmployerJobStatusApi(job.id, action))
      setFeedback(action === 'clone' ? 'Đã tạo một bản nháp mới từ tin tuyển dụng.' : 'Đã cập nhật trạng thái tin tuyển dụng.')
      dispatch(recruitmentActions.employerJobsLoad())
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Không thể cập nhật tin tuyển dụng.')
    } finally {
      setBusyId(null)
    }
  }

  return <main className="container employer-jobs-page">
    <header className="employer-jobs-hero">
      <div><span className="eyebrow">Không gian tuyển dụng</span><h1>Quản lý tin tuyển dụng</h1><p>Theo dõi toàn bộ vòng đời tin, ưu tiên vị trí cần xử lý và nhanh chóng tiếp cận ứng viên phù hợp.</p></div>
      <Link className="employer-jobs-create" to="/employer/jobs/new"><i className="bi bi-plus-lg" /><span><strong>Tạo tin mới</strong><small>Đăng một vị trí tuyển dụng</small></span></Link>
    </header>

    <section className="employer-job-metrics" aria-label="Tổng quan tin tuyển dụng">
      <article><span className="metric-icon metric-icon--green"><i className="bi bi-briefcase" /></span><div><small>Tổng số tin</small><strong>{stats.total}</strong><p>Tất cả vị trí đã tạo</p></div></article>
      <article><span className="metric-icon metric-icon--blue"><i className="bi bi-broadcast-pin" /></span><div><small>Đang tuyển</small><strong>{stats.active}</strong><p>Đang hiển thị công khai</p></div></article>
      <article><span className="metric-icon metric-icon--amber"><i className="bi bi-file-earmark-text" /></span><div><small>Bản nháp</small><strong>{stats.draft}</strong><p>Cần hoàn thiện nội dung</p></div></article>
      <article><span className="metric-icon metric-icon--red"><i className="bi bi-alarm" /></span><div><small>Cần chú ý</small><strong>{stats.attention}</strong><p>Sắp hết hạn trong 7 ngày</p></div></article>
    </section>

    {(error || feedback) && <div className={`employer-job-feedback${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}><i className={`bi ${error ? 'bi-exclamation-triangle' : 'bi-check-circle'}`} /><span>{error || feedback}</span>{feedback && <button type="button" onClick={() => setFeedback('')} aria-label="Đóng thông báo"><i className="bi bi-x-lg" /></button>}</div>}

    <section className="employer-job-workspace">
      <div className="employer-job-toolbar">
        <div><h2>Danh sách tin</h2><span>{filteredJobs.length} kết quả</span></div>
        <form>
          <label className="employer-job-search"><i className="bi bi-search" /><input placeholder="Tìm theo chức danh, địa điểm..." {...register('search')} /></label>
          <label className="employer-job-select"><i className="bi bi-funnel" /><select aria-label="Lọc theo trạng thái" {...register('status')}><option value="">Tất cả trạng thái</option>{Object.entries(statusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
          {(search || status) && <button className="employer-job-clear" type="button" onClick={() => reset()}>Xóa lọc</button>}
        </form>
      </div>

      {loading && <div className="employer-jobs-state"><span className="spinner-border text-success" /><p>Đang tải tin tuyển dụng...</p></div>}
      {!loading && filteredJobs.length === 0 && <div className="employer-jobs-state"><span><i className="bi bi-briefcase" /></span><h3>{jobs.length === 0 ? 'Chưa có tin tuyển dụng' : 'Không tìm thấy kết quả phù hợp'}</h3><p>{jobs.length === 0 ? 'Tạo tin đầu tiên để bắt đầu tiếp nhận hồ sơ ứng viên.' : 'Thử thay đổi từ khóa hoặc trạng thái đang lọc.'}</p>{jobs.length === 0 ? <Link to="/employer/jobs/new">Tạo tin tuyển dụng</Link> : <button type="button" onClick={() => reset()}>Xóa bộ lọc</button>}</div>}

      {!loading && filteredJobs.length > 0 && <div className="employer-job-list">{filteredJobs.map((job) => {
        const meta = statusMeta[job.status] || { label: job.status, icon: 'bi-circle' }
        const remainingDays = daysUntil(job.deadline)
        const isBusy = busyId === job.id
        const tags = Array.isArray(job.tags) ? job.tags : []
        return <article className={`employer-job-card employer-job-card--${job.status.toLowerCase()}`} key={job.id}>
          <div className="employer-job-card__accent" /><div className="employer-job-card__logo">{job.companyLogo || job.title.slice(0, 2).toUpperCase()}</div>
          <div className="employer-job-card__main">
            <div className="employer-job-card__top"><span className={`job-status job-status--${job.status.toLowerCase()}`}><i className={`bi ${meta.icon}`} />{meta.label}</span><span className={`job-deadline${remainingDays <= 7 ? ' is-urgent' : ''}`}><i className="bi bi-calendar3" />{remainingDays < 0 ? 'Đã hết hạn' : remainingDays === 0 ? 'Hết hạn hôm nay' : `Còn ${remainingDays} ngày`}</span></div>
            <h3>{job.title}</h3>
            <div className="employer-job-card__meta"><span><i className="bi bi-grid" />{job.category?.shortName}</span><span><i className="bi bi-geo-alt" />{job.location}</span><span><i className="bi bi-cash-stack" />{job.salary}</span><span><i className="bi bi-briefcase" />{job.employmentTypeLabel}</span></div>
            <div className="employer-job-card__skills">{tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}{tags.length > 4 && <span>+{tags.length - 4}</span>}</div>
          </div>
          <div className="employer-job-card__side">
            <Link className="job-primary-action" to={`/employer/applications?jobId=${job.id}`}><i className="bi bi-people" />Xem hồ sơ</Link>
            <div className="job-quick-actions"><Link title="Chỉnh sửa" to={`/employer/jobs/${job.id}/edit`}><i className="bi bi-pencil" /></Link><button title="Nhân bản" type="button" disabled={isBusy} onClick={() => void act(job, 'clone')}><i className="bi bi-copy" /></button>{(job.status === 'DRAFT' || job.status === 'HIDDEN') && <button className="is-positive" title="Đăng tin" type="button" disabled={isBusy} onClick={() => void act(job, 'publish')}><i className="bi bi-broadcast" /></button>}{job.status === 'ACTIVE' && <button title="Ẩn tin" type="button" disabled={isBusy} onClick={() => void act(job, 'hide')}><i className="bi bi-eye-slash" /></button>}{!['CLOSED', 'EXPIRED'].includes(job.status) && <button className="is-danger" title="Đóng tin" type="button" disabled={isBusy} onClick={() => void act(job, 'close')}><i className="bi bi-lock" /></button>}</div>
          </div>
        </article>
      })}</div>}
    </section>
  </main>
}
