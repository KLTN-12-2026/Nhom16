import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toggleFavoriteJobApi } from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

export default function CandidateSavedJobsPage() {
  const dispatch = useAppDispatch(); const { savedJobs: jobs, error } = useAppSelector(state => state.recruitment)
  const load = () => dispatch(recruitmentActions.savedJobsLoad())
  useEffect(() => { load() }, [dispatch])
  return <main className="container recruitment-page"><header className="recruitment-heading"><div><span className="eyebrow">Danh sách quan tâm</span><h1>Việc đã lưu</h1><p>Lưu lại cơ hội phù hợp để xem và ứng tuyển sau.</p></div></header>{error && <div className="alert alert-danger">{error}</div>}<section className="recruitment-list">{jobs.length === 0 && <div className="recruitment-empty"><i className="bi bi-heart" /><h2>Chưa có việc làm đã lưu</h2><Link to="/candidate/jobs">Tìm việc ngay</Link></div>}{jobs.map(job => <article className="recruitment-card" key={job.id}><div><h2>{job.title}</h2><p>{job.company} · {job.location} · {job.salary}</p><small>Hạn nộp: {job.deadline}</small></div><div className="recruitment-actions"><Link to={`/candidate/jobs/${job.id}`}>Xem chi tiết</Link><button className="danger" onClick={() => toggleFavoriteJobApi(job.id).then(load)}>Bỏ lưu</button></div></article>)}</section></main>
}
