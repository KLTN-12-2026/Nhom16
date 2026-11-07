import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { listNotificationsApi, markNotificationReadApi, type ApplicationData, type NotificationData } from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

const stages = ['RECEIVED', 'REVIEWING', 'INTERVIEW', 'OFFER']
const statusMeta: Record<string, { label: string; short: string; icon: string; tone: string; next: string }> = {
  RECEIVED: { label: 'Đã tiếp nhận hồ sơ', short: 'Tiếp nhận', icon: 'bi-inbox', tone: 'blue', next: 'Nhà tuyển dụng sẽ xem xét CV của bạn.' },
  REVIEWING: { label: 'Nhà tuyển dụng đang xem', short: 'Xem xét', icon: 'bi-eye', tone: 'amber', next: 'Hãy kiểm tra email và chuẩn bị giới thiệu bản thân.' },
  INTERVIEW: { label: 'Mời phỏng vấn', short: 'Phỏng vấn', icon: 'bi-camera-video', tone: 'violet', next: 'Xác nhận lịch và chuẩn bị câu hỏi cho buổi phỏng vấn.' },
  OFFER: { label: 'Đề nghị nhận việc', short: 'Đề nghị', icon: 'bi-patch-check', tone: 'green', next: 'Xem kỹ quyền lợi và phản hồi nhà tuyển dụng.' },
  REJECTED: { label: 'Chưa phù hợp', short: 'Chưa phù hợp', icon: 'bi-arrow-repeat', tone: 'red', next: 'Cập nhật CV và khám phá các cơ hội phù hợp khác.' },
}

interface ApplicationFilters { search: string; status: string }

const stringList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

function ApplicationCard({ item }: { item: ApplicationData }) {
  const meta = statusMeta[item.status] || statusMeta.RECEIVED
  const activeIndex = stages.indexOf(item.status)
  const tags = stringList(item.job.tags)
  const rejectedHistory = [...(item.history || [])].reverse().find((entry) => entry.toStatus === 'REJECTED')
  const isRejected = item.status === 'REJECTED'

  return <article className={`journey-card journey-card--rich${isRejected ? ' is-rejected' : ''}`}>
    <div className="journey-card__header">
      <div className={`journey-company-logo ${item.job.companyLogoClass || ''}`}>{item.job.companyLogo || item.job.company?.charAt(0) || 'CV'}</div>
      <div className="journey-card__title"><div><span className={`journey-status is-${meta.tone}`}><i className={`bi ${meta.icon}`} />{meta.label}</span><small><i className="bi bi-calendar3" /> Nộp {new Date(item.appliedAt).toLocaleDateString('vi-VN')}</small></div><h3>{item.job.title}</h3><p>{item.job.company}</p></div>
      <Link className="journey-jd-link" to={`/candidate/applications/${item.id}/job`}><i className="bi bi-file-earmark-text" /><span><strong>Xem JD đã nộp</strong><small>Chi tiết công việc</small></span><i className="bi bi-arrow-up-right" /></Link>
    </div>

    <div className="journey-card__facts">
      <span><i className="bi bi-geo-alt" /><small>Địa điểm</small><strong>{item.job.location}</strong></span>
      <span><i className="bi bi-wallet2" /><small>Mức lương</small><strong>{item.job.salary || 'Thỏa thuận'}</strong></span>
      <span><i className="bi bi-briefcase" /><small>Hình thức</small><strong>{item.job.workModeLabel || item.job.employmentTypeLabel}</strong></span>
      <span><i className="bi bi-file-earmark-person" /><small>CV đã nộp</small><strong>{item.cv.displayName}</strong></span>
    </div>

    {tags.length > 0 && <div className="journey-card__tags">{tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>}

    {isRejected ? <div className="journey-rejection" role="status"><span><i className="bi bi-file-earmark-x" /></span><div><strong>CV “{item.cv.displayName}” chưa được lựa chọn</strong><p>{rejectedHistory?.note || 'Doanh nghiệp đánh giá hồ sơ hiện tại chưa phù hợp với yêu cầu của vị trí này.'}</p>{rejectedHistory?.createdAt && <small>Cập nhật {new Date(rejectedHistory.createdAt).toLocaleString('vi-VN')}</small>}</div><Link to="/candidate/jobs">Tìm việc tương tự <i className="bi bi-arrow-right" /></Link></div> : <div className="journey-progress"><div className="journey-timeline" aria-label="Tiến trình hồ sơ">{stages.map((stage, index) => <div className={index <= activeIndex ? 'is-complete' : ''} key={stage}><span><i className={`bi ${statusMeta[stage].icon}`} /></span><small>{statusMeta[stage].short}</small></div>)}</div><aside className="journey-next"><span>Bước tiếp theo</span><p>{meta.next}</p></aside></div>}

    <footer className="journey-card__footer"><span><i className="bi bi-shield-check" /> Hồ sơ được lưu an toàn</span><div><Link to={`/candidate/applications/${item.id}/job`}>Xem JD</Link><Link to="/candidate/cv">Quản lý CV</Link></div></footer>
  </article>
}

export default function CandidateApplicationsPage() {
  const dispatch = useAppDispatch()
  const { candidateApplications: items, error, loading } = useAppSelector((state) => state.recruitment)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const { register, watch, reset } = useForm<ApplicationFilters>({ defaultValues: { search: '', status: '' } })
  const search = watch('search').trim().toLocaleLowerCase('vi-VN')
  const status = watch('status')

  useEffect(() => {
    dispatch(recruitmentActions.candidateApplicationsLoad())
    listNotificationsApi().then((response) => setNotifications(response.data)).catch(() => undefined)
  }, [dispatch])

  const unread = notifications.filter((item) => !item.readAt)
  const counts = useMemo(() => ({ active: items.filter((item) => !['OFFER', 'REJECTED'].includes(item.status)).length, interviews: items.filter((item) => item.status === 'INTERVIEW').length, offers: items.filter((item) => item.status === 'OFFER').length, rejected: items.filter((item) => item.status === 'REJECTED').length }), [items])
  const filtered = useMemo(() => items.filter((item) => {
    const keyword = `${item.job.title} ${item.job.company} ${item.job.location} ${item.cv.displayName}`.toLocaleLowerCase('vi-VN')
    return (!status || item.status === status) && (!search || keyword.includes(search))
  }), [items, search, status])

  const readNotification = (id: number) => markNotificationReadApi(id).then(() => setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)))

  return <main className="candidate-journey-page"><div className="container">
    <header className="candidate-journey-hero"><div><span className="candidate-journey-kicker">Hành trình ứng tuyển</span><h1>Việc đã ứng tuyển</h1><p>Theo dõi tiến trình, không bỏ lỡ lời mời phỏng vấn và biết rõ bước tiếp theo.</p></div><Link to="/candidate/jobs"><i className="bi bi-search" /><span><strong>Tìm cơ hội mới</strong><small>Khám phá việc phù hợp</small></span><i className="bi bi-arrow-right" /></Link></header>
    <section className="journey-metrics"><article><span className="is-blue"><i className="bi bi-send-check" /></span><div><small>Tổng hồ sơ</small><strong>{items.length}</strong><p>đã gửi đến doanh nghiệp</p></div></article><article><span className="is-amber"><i className="bi bi-hourglass-split" /></span><div><small>Đang xử lý</small><strong>{counts.active}</strong><p>hồ sơ còn trong quy trình</p></div></article><article><span className="is-violet"><i className="bi bi-camera-video" /></span><div><small>Phỏng vấn</small><strong>{counts.interviews}</strong><p>lịch cần chuẩn bị</p></div></article><article><span className="is-green"><i className="bi bi-patch-check" /></span><div><small>Đề nghị</small><strong>{counts.offers}</strong><p>cơ hội nhận việc</p></div></article><article><span className="is-red"><i className="bi bi-file-earmark-x" /></span><div><small>Chưa phù hợp</small><strong>{counts.rejected}</strong><p>CV cần tối ưu thêm</p></div></article></section>
    {unread.length > 0 && <section className="journey-notifications"><header><div><i className="bi bi-bell-fill" /><span><strong>{unread.length} cập nhật mới</strong><small>Nhấn vào thông báo để đánh dấu đã đọc</small></span></div></header><div>{unread.slice(0, 3).map((item) => { const rejected = item.type === 'APPLICATION_REJECTED'; return <button className={rejected ? 'is-rejected' : ''} key={item.id} onClick={() => void readNotification(item.id)}><i className={`bi ${rejected ? 'bi-file-earmark-x' : 'bi-stars'}`} /><span><strong>{item.title}</strong><small>{item.message}</small></span><i className="bi bi-check2" /></button> })}</div></section>}
    {error && <div className="journey-alert" role="alert"><i className="bi bi-exclamation-triangle" />{error}</div>}
    <section className="journey-workspace"><div className="journey-toolbar"><div><h2>Hồ sơ của bạn</h2><span>{filtered.length} kết quả</span></div><form><label><i className="bi bi-search" /><input placeholder="Tìm vị trí, công ty hoặc CV..." {...register('search')} /></label><label><i className="bi bi-funnel" /><select aria-label="Lọc trạng thái" {...register('status')}><option value="">Tất cả trạng thái</option>{Object.entries(statusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>{(search || status) && <button type="button" onClick={() => reset()}>Xóa lọc</button>}</form></div>
      {loading && <div className="journey-state"><span className="spinner-border text-success" /><p>Đang cập nhật hành trình ứng tuyển...</p></div>}
      {!loading && filtered.length === 0 && <div className="journey-state"><i className="bi bi-compass" /><h2>{items.length ? 'Không có hồ sơ khớp bộ lọc' : 'Hành trình mới đang chờ bạn'}</h2><p>{items.length ? 'Thử đổi từ khóa hoặc trạng thái để xem hồ sơ.' : 'Khám phá công việc và gửi CV đầu tiên để bắt đầu theo dõi tiến trình.'}</p>{items.length ? <button onClick={() => reset()}>Đặt lại bộ lọc</button> : <Link to="/candidate/jobs">Khám phá việc làm</Link>}</div>}
      {!loading && filtered.length > 0 && <div className="journey-list">{filtered.map((item) => <ApplicationCard item={item} key={item.id} />)}</div>}
    </section>
  </div></main>
}
