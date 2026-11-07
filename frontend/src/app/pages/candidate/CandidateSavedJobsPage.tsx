import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toggleFavoriteJobApi } from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

interface SavedJobFilters { search: string; urgency: string }
const daysUntil = (deadline: string) => Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
const jobTags = (value: unknown) => Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string') : []

export default function CandidateSavedJobsPage() {
  const dispatch = useAppDispatch()
  const { savedJobs: jobs, error, loading } = useAppSelector((state) => state.recruitment)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const { register, watch, reset } = useForm<SavedJobFilters>({ defaultValues: { search: '', urgency: '' } })
  const search = watch('search').trim().toLocaleLowerCase('vi-VN')
  const urgency = watch('urgency')
  useEffect(() => { dispatch(recruitmentActions.savedJobsLoad()) }, [dispatch])
  const filtered = useMemo(() => jobs.filter((job) => { const days = daysUntil(job.deadline); const matchesUrgency = !urgency || (urgency === 'urgent' ? days >= 0 && days <= 7 : urgency === 'open' ? days > 7 : days < 0); return matchesUrgency && (!search || `${job.title} ${job.company} ${job.location} ${jobTags(job.tags).join(' ')}`.toLocaleLowerCase('vi-VN').includes(search)) }), [jobs, search, urgency])
  const urgentCount = jobs.filter((job) => { const days = daysUntil(job.deadline); return days >= 0 && days <= 7 }).length
  const remove = async (jobId: number) => { setRemovingId(jobId); try { await toggleFavoriteJobApi(jobId); dispatch(recruitmentActions.savedJobsLoad()) } finally { setRemovingId(null) } }

  return <main className="saved-jobs-page"><div className="container"><header className="saved-jobs-hero"><div><span className="saved-jobs-kicker"><i className="bi bi-heart-fill" /> Danh sách quan tâm</span><h1>Việc đã lưu</h1><p>Biến danh sách yêu thích thành kế hoạch ứng tuyển có thứ tự ưu tiên.</p></div><div className="saved-jobs-summary"><span><strong>{jobs.length}</strong><small>Cơ hội đã lưu</small></span><span><strong>{urgentCount}</strong><small>Sắp hết hạn</small></span></div></header>
    {urgentCount > 0 && <div className="saved-jobs-nudge"><i className="bi bi-alarm" /><span><strong>{urgentCount} công việc sẽ hết hạn trong 7 ngày.</strong> Xem lại CV và ứng tuyển sớm để không bỏ lỡ cơ hội.</span><button type="button" onClick={() => reset({ search: '', urgency: 'urgent' })}>Xem ngay</button></div>}{error && <div className="journey-alert" role="alert"><i className="bi bi-exclamation-triangle" />{error}</div>}
    <section className="saved-jobs-workspace"><div className="saved-jobs-toolbar"><div><h2>Cơ hội của bạn</h2><span>{filtered.length} kết quả</span></div><form><label><i className="bi bi-search" /><input placeholder="Tìm chức danh, công ty, kỹ năng..." {...register('search')} /></label><label><i className="bi bi-calendar-event" /><select aria-label="Lọc theo hạn nộp" {...register('urgency')}><option value="">Mọi hạn nộp</option><option value="urgent">Sắp hết hạn</option><option value="open">Còn nhiều thời gian</option><option value="expired">Đã hết hạn</option></select></label>{(search || urgency) && <button type="button" onClick={() => reset()}>Xóa lọc</button>}</form></div>{loading && <div className="journey-state"><span className="spinner-border text-success" /><p>Đang tải việc làm đã lưu...</p></div>}{!loading && filtered.length === 0 && <div className="journey-state"><i className="bi bi-heart" /><h2>{jobs.length ? 'Không có công việc khớp bộ lọc' : 'Danh sách yêu thích đang trống'}</h2><p>{jobs.length ? 'Thử thay đổi từ khóa hoặc hạn nộp.' : 'Lưu những cơ hội phù hợp để so sánh và ứng tuyển sau.'}</p>{jobs.length ? <button onClick={() => reset()}>Đặt lại bộ lọc</button> : <Link to="/candidate/jobs">Tìm việc ngay</Link>}</div>}
      {!loading && filtered.length > 0 && <div className="saved-job-grid">{filtered.map((job) => { const days = daysUntil(job.deadline); const tags = jobTags(job.tags); return <article className="saved-job-card" key={job.id}><div className="saved-job-card__head"><div className={`saved-job-logo ${job.companyLogoClass || 'job-logo--green'}`}>{job.companyLogo || job.company?.charAt(0) || 'CV'}</div><button type="button" aria-label="Bỏ lưu công việc" disabled={removingId === job.id} onClick={() => void remove(job.id)}><i className="bi bi-heart-fill" /></button></div><div className="saved-job-card__body"><span className={`saved-deadline${days >= 0 && days <= 7 ? ' is-urgent' : days < 0 ? ' is-expired' : ''}`}><i className="bi bi-clock" />{days < 0 ? 'Đã hết hạn' : days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`}</span><h3>{job.title}</h3><p>{job.company}</p><div className="saved-job-meta"><span><i className="bi bi-geo-alt" />{job.location}</span><span><i className="bi bi-wallet2" />{job.salary}</span><span><i className="bi bi-briefcase" />{job.experienceLabel}</span></div>{tags.length > 0 && <div className="saved-job-skills">{tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>}</div><footer><span><i className="bi bi-building" />{job.workModeLabel}</span><Link to={`/candidate/jobs/${job.id}`}>Xem chi tiết <i className="bi bi-arrow-up-right" /></Link></footer></article>})}</div>}
    </section></div></main>
}
