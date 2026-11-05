import { useEffect, useState } from 'react'
import { listFavoriteCandidatesApi, toggleFavoriteCandidateApi, type FavoriteCandidateData } from '../../apis/recruitment'

export default function EmployerFavoriteCandidatesPage() {
  const [items, setItems] = useState<FavoriteCandidateData[]>([]); const [error, setError] = useState('')
  const load = () => listFavoriteCandidatesApi().then(response => setItems(response.data)).catch(cause => setError(cause.message))
  useEffect(() => { void load() }, [])
  return <main className="container recruitment-page"><header className="recruitment-heading"><div><span className="eyebrow">Danh sách quan tâm</span><h1>Ứng viên đã lưu</h1><p>Theo dõi những ứng viên tiềm năng đã ứng tuyển vào doanh nghiệp.</p></div></header>{error && <div className="alert alert-danger">{error}</div>}<section className="recruitment-list">{items.length === 0 && <div className="recruitment-empty"><i className="bi bi-person-heart" /><h2>Chưa lưu ứng viên nào</h2></div>}{items.map(item => <article className="application-card" key={item.id}><div className="application-card__avatar">{item.candidate.fullName[0]}</div><div><h2>{item.candidate.fullName}</h2><p>{item.candidate.candidateProfile?.title || 'Ứng viên'} · {item.candidate.email}</p><div className="cv-skill-list">{item.candidate.candidateProfile?.skills?.slice(0, 6).map(skill => <span key={skill}>{skill}</span>)}</div></div><button className="btn btn-outline-danger" onClick={() => toggleFavoriteCandidateApi(item.candidate.id).then(load)}>Bỏ lưu</button></article>)}</section></main>
}
