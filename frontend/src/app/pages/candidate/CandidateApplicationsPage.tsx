import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listNotificationsApi, markNotificationReadApi, type NotificationData } from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

const labels: Record<string, string> = { RECEIVED: 'Đã tiếp nhận', REVIEWING: 'Nhà tuyển dụng đang xem', INTERVIEW: 'Mời phỏng vấn', OFFER: 'Đề nghị nhận việc', REJECTED: 'Chưa phù hợp' }
export default function CandidateApplicationsPage() {
  const dispatch = useAppDispatch(); const { candidateApplications: items, error } = useAppSelector(state => state.recruitment)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  useEffect(() => { dispatch(recruitmentActions.candidateApplicationsLoad()); listNotificationsApi().then(response => setNotifications(response.data)).catch(() => undefined) }, [dispatch])
  return <main className="container recruitment-page"><header className="recruitment-heading"><div><span className="eyebrow">Hành trình ứng tuyển</span><h1>Việc đã ứng tuyển</h1><p>Theo dõi trạng thái hồ sơ và các bước tiếp theo từ nhà tuyển dụng.</p></div></header>{error && <div className="alert alert-danger">{error}</div>}{notifications.some(item => !item.readAt) && <section className="application-notifications"><h2>Thông báo mới</h2>{notifications.filter(item => !item.readAt).map(item => <button key={item.id} onClick={() => markNotificationReadApi(item.id).then(() => setNotifications(current => current.map(value => value.id === item.id ? { ...value, readAt: new Date().toISOString() } : value)))}><i className="bi bi-bell-fill" /><span><strong>{item.title}</strong>{item.message}</span></button>)}</section>}<section className="recruitment-list">{items.length === 0 && <div className="recruitment-empty"><i className="bi bi-send" /><h2>Bạn chưa ứng tuyển công việc nào</h2><Link to="/candidate/jobs">Khám phá việc làm</Link></div>}{items.map(item => <article className="recruitment-card" key={item.id}><div><span className={`status-pill status-pill--${item.status.toLowerCase()}`}>{labels[item.status] || item.status}</span><h2>{item.job.title}</h2><p>{item.job.company} · {item.job.location}</p><small>CV: {item.cv.displayName} · Nộp {new Date(item.appliedAt).toLocaleDateString('vi-VN')}</small></div><Link to={`/candidate/jobs/${item.job.id}`}>Xem tin</Link></article>)}</section></main>
}
