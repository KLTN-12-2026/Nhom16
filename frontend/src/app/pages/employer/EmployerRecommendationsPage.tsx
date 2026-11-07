import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toggleFavoriteCandidateApi, updateApplicationStatusApi, type ApplicationData } from '../../apis/recruitment'
import { recruitmentActions } from '../../modules/recruitment/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

interface RecommendationFilters { search: string; minimumScore: string }

const normalize = (value: string) => value.trim().toLocaleLowerCase('vi-VN')
const stringList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const scoreCandidate = (application: ApplicationData, targetSkills: string[]) => {
  const skills = stringList(application.cv.skills).map(normalize)
  const matchedSkills = targetSkills.filter((skill) => skills.some((candidateSkill) => candidateSkill.includes(normalize(skill)) || normalize(skill).includes(candidateSkill)))
  const skillScore = targetSkills.length ? Math.round((matchedSkills.length / targetSkills.length) * 48) : Math.min(skills.length * 4, 28)
  const titleMatch = application.cv.headline && normalize(application.cv.headline).includes(normalize(application.job.title).split(' ')[0]) ? 8 : 0
  return { score: Math.min(98, 42 + skillScore + titleMatch), matchedSkills }
}

export default function EmployerRecommendationsPage() {
  const dispatch = useAppDispatch()
  const { employerApplications, employerJobs, loading, error } = useAppSelector((state) => state.recruitment)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [feedback, setFeedback] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const { register, watch, reset } = useForm<RecommendationFilters>({ defaultValues: { search: '', minimumScore: '0' } })
  const search = normalize(watch('search'))
  const minimumScore = Number(watch('minimumScore'))

  useEffect(() => {
    dispatch(recruitmentActions.employerJobsLoad())
    dispatch(recruitmentActions.employerApplicationsLoad())
  }, [dispatch])

  useEffect(() => {
    if (!selectedJobId && employerJobs.length) setSelectedJobId(employerJobs.find((job) => job.status === 'ACTIVE')?.id || employerJobs[0].id)
  }, [employerJobs, selectedJobId])

  const selectedJob = employerJobs.find((job) => job.id === selectedJobId)
  const targetSkills = useMemo(() => stringList(selectedJob?.tags), [selectedJob])
  const recommendations = useMemo(() => {
    const unique = new Map<number, ApplicationData>()
    employerApplications.forEach((item) => {
      if (item.job.id === selectedJobId && item.candidate && !unique.has(item.candidate.id)) unique.set(item.candidate.id, item)
    })
    return [...unique.values()].map((application) => ({ application, ...scoreCandidate(application, targetSkills) }))
      .filter(({ application, score }) => {
        const keyword = `${application.candidate?.fullName || ''} ${application.cv.headline || ''} ${stringList(application.cv.skills).join(' ')}`.toLocaleLowerCase('vi-VN')
        return score >= minimumScore && (!search || keyword.includes(search))
      }).sort((a, b) => b.score - a.score)
  }, [employerApplications, minimumScore, search, selectedJobId, targetSkills])

  const favorite = async (application: ApplicationData) => {
    if (!application.candidate) return
    setBusyId(application.id)
    try {
      const response = await toggleFavoriteCandidateApi(application.candidate.id)
      setFavoriteIds((current) => response.data.favorite ? [...new Set([...current, application.candidate!.id])] : current.filter((id) => id !== application.candidate!.id))
      setFeedback(response.data.favorite ? 'Đã lưu ứng viên vào danh sách quan tâm.' : 'Đã bỏ lưu ứng viên.')
    } finally { setBusyId(null) }
  }

  const invite = async (application: ApplicationData) => {
    setBusyId(application.id)
    try {
      await updateApplicationStatusApi(application.id, 'INTERVIEW', `Được đề xuất từ AI matching cho ${selectedJob?.title || 'tin tuyển dụng'}.`)
      setFeedback(`Đã gửi lời mời phỏng vấn đến ${application.candidate?.fullName || 'ứng viên'}.`)
      dispatch(recruitmentActions.employerApplicationsLoad())
    } finally { setBusyId(null) }
  }

  const toggleCompare = (candidateId: number) => setCompareIds((current) => current.includes(candidateId) ? current.filter((id) => id !== candidateId) : current.length < 3 ? [...current, candidateId] : current)

  return <main className="recommendations-page"><div className="container">
    <header className="recommendations-hero"><div><span className="recommendations-kicker"><i className="bi bi-stars" /> AI Talent Match</span><h1>Ứng viên phù hợp</h1><p>Xếp hạng ứng viên theo kỹ năng trong CV và yêu cầu của từng tin tuyển dụng.</p></div><div className="recommendations-orbit"><strong>{recommendations.length}</strong><span>hồ sơ tiềm năng</span></div></header>

    <section className="recommendations-insight"><div><i className="bi bi-lightning-charge-fill" /><span><strong>Gợi ý thông minh</strong>Điểm phù hợp được giải thích bằng kỹ năng trùng khớp, không phải một “hộp đen”.</span></div><div><i className="bi bi-shield-check" /><span><strong>Dữ liệu an toàn</strong>Chỉ đánh giá những ứng viên đã chủ động gửi hồ sơ đến doanh nghiệp.</span></div><div><i className="bi bi-people" /><span><strong>So sánh nhanh</strong>Chọn tối đa 3 hồ sơ để tạo shortlist trước khi phỏng vấn.</span></div></section>

    {feedback && <div className="recommendations-feedback" role="status"><i className="bi bi-check-circle" /><span>{feedback}</span><button onClick={() => setFeedback('')} aria-label="Đóng"><i className="bi bi-x-lg" /></button></div>}
    {error && <div className="recommendations-feedback is-error" role="alert"><i className="bi bi-exclamation-triangle" />{error}</div>}

    <section className="recommendations-toolbar">
      <label><span>Tối ưu cho tin tuyển dụng</span><select value={selectedJobId || ''} onChange={(event) => setSelectedJobId(Number(event.target.value))}>{employerJobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.status}</option>)}</select></label>
      <form><label className="recommendations-search"><i className="bi bi-search" /><input placeholder="Tìm tên, chức danh hoặc kỹ năng..." {...register('search')} /></label><label className="recommendations-score"><i className="bi bi-sliders" /><select aria-label="Điểm phù hợp tối thiểu" {...register('minimumScore')}><option value="0">Mọi mức phù hợp</option><option value="70">Từ 70%</option><option value="80">Từ 80%</option><option value="90">Từ 90%</option></select></label>{(Boolean(search) || minimumScore > 0) && <button type="button" onClick={() => reset()}>Xóa lọc</button>}</form>
    </section>

    {compareIds.length > 0 && <aside className="compare-dock"><div><i className="bi bi-columns-gap" /><span><strong>Shortlist so sánh</strong>{compareIds.length}/3 ứng viên đã chọn</span></div><button type="button" onClick={() => setCompareIds([])}>Xóa danh sách</button></aside>}

    {loading && <div className="recommendations-state"><span className="spinner-border text-success" /><p>AI đang tổng hợp hồ sơ phù hợp...</p></div>}
    {!loading && !employerJobs.length && <div className="recommendations-state"><i className="bi bi-briefcase" /><h2>Cần có tin tuyển dụng trước</h2><p>Tạo và đăng tin để hệ thống hiểu đúng vị trí bạn đang tìm kiếm.</p><Link to="/employer/jobs/new">Tạo tin tuyển dụng</Link></div>}
    {!loading && employerJobs.length > 0 && recommendations.length === 0 && <div className="recommendations-state"><i className="bi bi-person-search" /><h2>Chưa tìm thấy hồ sơ phù hợp</h2><p>Hãy giảm ngưỡng điểm, đổi từ khóa hoặc chờ thêm ứng viên gửi hồ sơ.</p><button type="button" onClick={() => reset()}>Đặt lại bộ lọc</button></div>}

    {!loading && recommendations.length > 0 && <section className="recommendation-grid">{recommendations.map(({ application, score, matchedSkills }, index) => {
      const candidate = application.candidate!
      const skills = application.cv.skills || []
      const isFavorite = favoriteIds.includes(candidate.id)
      const isCompared = compareIds.includes(candidate.id)
      return <article className="recommendation-card" key={candidate.id}>
        <div className="recommendation-rank">#{index + 1}</div><div className="recommendation-score" style={{ '--score': `${score * 3.6}deg` } as CSSProperties}><div><strong>{score}</strong><span>%</span></div></div>
        <div className="recommendation-person"><div className="recommendation-avatar">{candidate.fullName.charAt(0).toUpperCase()}</div><div><h2>{candidate.fullName}</h2><p>{application.cv.headline || 'Ứng viên tiềm năng'}</p><small><i className="bi bi-file-earmark-person" /> {application.cv.displayName}</small></div></div>
        <div className="recommendation-explain"><span className="recommendation-label">Vì sao phù hợp?</span><p>{matchedSkills.length ? `Khớp ${matchedSkills.length}/${targetSkills.length} kỹ năng trọng tâm của tin.` : 'Hồ sơ có nền tảng kỹ năng có thể phát triển cho vị trí này.'}</p><div>{skills.slice(0, 6).map((skill) => <span className={matchedSkills.some((value) => normalize(value) === normalize(skill)) ? 'is-match' : ''} key={skill}>{matchedSkills.some((value) => normalize(value) === normalize(skill)) && <i className="bi bi-check2" />}{skill}</span>)}</div></div>
        <div className="recommendation-actions"><button className={isCompared ? 'is-selected' : ''} type="button" onClick={() => toggleCompare(candidate.id)} disabled={!isCompared && compareIds.length >= 3}><i className="bi bi-columns-gap" />{isCompared ? 'Đã chọn' : 'So sánh'}</button><button type="button" disabled={busyId === application.id} onClick={() => void favorite(application)}><i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} />{isFavorite ? 'Đã lưu' : 'Lưu'}</button><button className="is-primary" type="button" disabled={busyId === application.id || application.status === 'INTERVIEW'} onClick={() => void invite(application)}><i className="bi bi-send" />{application.status === 'INTERVIEW' ? 'Đã mời' : 'Mời phỏng vấn'}</button></div>
      </article>
    })}</section>}
  </div></main>
}
