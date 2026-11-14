import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import type { CvJobComparison, MatchCriterion } from '../../apis/ai'
import { listCandidateCvsApi, type CandidateCv } from '../../apis/candidate'
import { listPublicJobsApi, type JobData } from '../../apis/job'
import { recruitmentAiActions } from '../../modules/recruitment-ai/redux'
import type { AppDispatch, RootState } from '../../store'
import '../../../styles/recruitment-ai.scss'

type Form = { cvId: string; jobId: string }
const statusText: Record<CvJobComparison['status'], string> = { PENDING: 'Đang chờ xử lý', PROCESSING: 'AI đang đối chiếu', COMPLETED: 'Đã hoàn tất', FAILED: 'Đối chiếu thất bại' }

const CriteriaColumn = ({ title, icon, items, tone, hint }: { title: string; icon: string; items: MatchCriterion[]; tone: string; hint: string }) => <section className={`ai-criteria is-${tone}`}>
  <header><span><i className={`bi ${icon}`} /></span><div><h3>{title}</h3><p>{hint}</p></div><em>{items.length}</em></header>
  <div>{items.length ? items.map((item, index) => <article key={`${item.criterion}-${index}`}><strong>{item.criterion}</strong><p><i className="bi bi-quote" />{item.evidence}</p></article>) : <div className="ai-criteria__empty"><i className="bi bi-dash-circle" /> Không có tiêu chí trong nhóm này</div>}</div>
</section>

export default function CandidateAiMatchPage() {
  const dispatch = useDispatch<AppDispatch>()
  const ai = useSelector((state: RootState) => state.recruitmentAi)
  const [cvs, setCvs] = useState<CandidateCv[]>([])
  const [jobs, setJobs] = useState<JobData[]>([])
  const [selected, setSelected] = useState<CvJobComparison | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { register, handleSubmit, watch } = useForm<Form>()
  const watchedCv = Number(watch('cvId'))
  const watchedJob = Number(watch('jobId'))

  useEffect(() => {
    void Promise.all([listCandidateCvsApi(), listPublicJobsApi({ limit: 100 })]).then(([cvResponse, jobResponse]) => {
      setCvs(cvResponse.data.cvs.filter(cv => ['completed', 'partial'].includes(cv.extractionStatus)))
      setJobs(jobResponse.data.jobs)
    })
    dispatch(recruitmentAiActions.listMatches())
  }, [dispatch])
  const current = useMemo(() => ai.comparisons.find(item => item.id === selected?.id) || ai.comparisons[0] || null, [ai.comparisons, selected?.id])
  useEffect(() => { if (current !== selected) setSelected(current) }, [current, selected])
  useEffect(() => { setConfirmingDelete(false) }, [selected?.id])

  const selectedCv = cvs.find(cv => cv.id === watchedCv)
  const selectedJob = jobs.find(job => job.id === watchedJob)
  const total = selected ? selected.metCriteria.length + selected.partialCriteria.length + selected.missingCriteria.length : 0
  const matchScore = selected?.matchScore ?? (total ? Math.round(((selected!.metCriteria.length + (selected!.partialCriteria.length * 0.5)) / total) * 100) : null)
  const run = ({ cvId, jobId }: Form) => dispatch(recruitmentAiActions.requestMatch(Number(cvId), Number(jobId), false))
  const retry = () => { if (selected) dispatch(recruitmentAiActions.requestMatch(selected.cvId, selected.jobId, true)) }
  const removeResult = () => {
    if (!selected) return
    if (!confirmingDelete) { setConfirmingDelete(true); return }
    dispatch(recruitmentAiActions.deleteMatch(selected.id))
    setConfirmingDelete(false)
  }

  return <main className="container ai-studio ai-studio--match">
    <header className="ai-studio__header">
      <div><span className="ai-studio__eyebrow"><i className="bi bi-intersect" /> AI Candidate Fit</span><h1>CV × JD Match Lab</h1><p>Đối chiếu từng yêu cầu với bằng chứng trực tiếp trong CV — không suy đoán, không dùng dữ liệu ngoài hệ thống.</p></div>
      <div className="ai-studio__trust"><i className="bi bi-shield-check" /><span><strong>Đánh giá có căn cứ</strong>Mỗi kết luận đều kèm bằng chứng kiểm tra được</span></div>
    </header>

    <section className="ai-match-builder">
      <div className={`ai-source-card ${selectedCv ? 'is-selected' : ''}`}><span>01</span><i className="bi bi-file-earmark-person" /><div><small>Hồ sơ đầu vào</small><strong>{selectedCv?.displayName || 'Chọn CV đã phân tích'}</strong></div><select {...register('cvId', { required: true })}><option value="">Chọn CV...</option>{cvs.map(cv => <option value={cv.id} key={cv.id}>{cv.displayName}</option>)}</select></div>
      <div className="ai-match-connector"><i className="bi bi-stars" /><span /></div>
      <div className={`ai-source-card ${selectedJob ? 'is-selected' : ''}`}><span>02</span><i className="bi bi-briefcase" /><div><small>Cơ hội mục tiêu</small><strong>{selectedJob?.title || 'Chọn tin tuyển dụng'}</strong></div><select {...register('jobId', { required: true })}><option value="">Chọn công việc...</option>{jobs.map(job => <option value={job.id} key={job.id}>{job.title} · {job.company}</option>)}</select></div>
      <button className="ai-match-run" onClick={handleSubmit(run)} disabled={ai.processing}><i className={`bi ${ai.processing ? 'bi-arrow-repeat ai-spin' : 'bi-intersect'}`} /><span>{ai.processing ? 'AI đang đối chiếu' : 'Bắt đầu so sánh'}<small>CV và JD nội bộ</small></span></button>
    </section>

    {ai.error && <div className="ai-feedback ai-feedback--error" role="alert"><i className="bi bi-exclamation-octagon" /><div><strong>Không thể so sánh CV và JD</strong><span>{ai.error}</span></div><button onClick={retry}>Thử lại</button></div>}

    <div className="ai-studio__workspace">
      <aside className="ai-runs">
        <header><div><span>Lịch sử đối chiếu</span><strong>{ai.comparisons.length} kết quả gần đây</strong></div><button title="Làm mới" onClick={() => dispatch(recruitmentAiActions.listMatches())}><i className="bi bi-arrow-clockwise" /></button></header>
        {ai.loading ? <div className="ai-runs__loading"><span /><span /><span /></div> : ai.comparisons.length === 0 ? <div className="ai-runs__empty"><i className="bi bi-inbox" /><span>Chưa có lần so sánh</span></div> : ai.comparisons.map(item => <button key={item.id} className={selected?.id === item.id ? 'is-active' : ''} onClick={() => setSelected(item)}><span className={`ai-run-icon is-${item.status.toLowerCase()}`}><i className="bi bi-intersect" /></span><span><strong>{item.job?.title || `Tin #${item.jobId}`}</strong><small>{item.cv?.displayName || `CV #${item.cvId}`} · {statusText[item.status]}</small></span><i className="bi bi-chevron-right" /></button>)}
      </aside>

      <section className="ai-editor ai-match-result">
        {!selected ? <div className="ai-editor__empty"><span><i className="bi bi-intersect" /></span><h2>Tìm điểm giao giữa CV và JD</h2><p>Chọn hai nguồn dữ liệu ở phía trên để AI đối chiếu theo từng tiêu chí.</p></div> : <>
          <header className="ai-match-result__header"><div><span className={`ai-pill is-${selected.status.toLowerCase()}`}><i className="bi bi-circle-fill" />{statusText[selected.status]}</span><h2>{selected.job?.title || `Tin tuyển dụng #${selected.jobId}`}</h2><p>{selected.cv?.displayName || `CV #${selected.cvId}`} · {selected.job?.company}</p></div><div className="ai-match-result__tools">{selected.status === 'COMPLETED' && <div className="ai-score-card"><span className="ai-score-card__ring" style={{ '--match-score': `${matchScore ?? 0}%` } as CSSProperties}><strong>{matchScore ?? 0}</strong><small>/100</small></span><div className="ai-score-card__copy"><span>ĐIỂM PHÙ HỢP THAM KHẢO</span><strong>{(matchScore ?? 0) >= 75 ? 'Phù hợp tốt' : (matchScore ?? 0) >= 50 ? 'Có tiềm năng' : 'Cần bổ sung'}</strong><small><b>{total}</b> tiêu chí đã kiểm chứng bằng dữ liệu CV</small></div></div>}<div className={`ai-delete-result ${confirmingDelete ? 'is-confirming' : ''}`}><button type="button" onClick={removeResult} disabled={ai.processing}><i className="bi bi-trash3" />{confirmingDelete ? 'Xác nhận xóa' : 'Xóa kết quả'}</button>{confirmingDelete && <button type="button" className="is-cancel" onClick={() => setConfirmingDelete(false)}>Hủy</button>}</div></div></header>
          {['PENDING', 'PROCESSING'].includes(selected.status) && <div className="ai-progress"><span className="ai-progress__visual"><i className="bi bi-intersect" /></span><div><strong>{selected.status === 'PENDING' ? 'Đang chờ worker AI tiếp nhận' : 'Đang đối chiếu kỹ năng, kinh nghiệm và yêu cầu bắt buộc'}</strong><p>Kết quả sẽ tự động cập nhật khi xử lý hoàn tất.</p><span className="ai-progress__bar"><i /></span></div></div>}
          {selected.status === 'FAILED' && <div className="ai-feedback ai-feedback--error"><i className="bi bi-exclamation-octagon" /><div><strong>Không thể hoàn tất đối chiếu</strong><span>{selected.errorMessage || 'AI chưa thể xử lý dữ liệu ở thời điểm hiện tại.'}</span></div><button onClick={retry}>So sánh lại</button></div>}
          {selected.status === 'COMPLETED' && <div className="ai-match-result__content"><div className="ai-score-note"><i className="bi bi-calculator" /><span><strong>Cách tính minh bạch</strong><small>Đáp ứng = 100% · Một phần = 50% · Còn thiếu = 0%. Điểm do backend tính, AI không tự chấm.</small></span><em>Chỉ dùng để tham khảo</em></div><div className="ai-match-stats"><article className="is-met"><span><i className="bi bi-check2-circle" /></span><div><small>Đã đáp ứng</small><strong>{selected.metCriteria.length}</strong></div></article><article className="is-partial"><span><i className="bi bi-circle-half" /></span><div><small>Đáp ứng một phần</small><strong>{selected.partialCriteria.length}</strong></div></article><article className="is-missing"><span><i className="bi bi-exclamation-circle" /></span><div><small>Còn thiếu</small><strong>{selected.missingCriteria.length}</strong></div></article></div><div className="ai-comparison-grid"><CriteriaColumn title="Đã đáp ứng" icon="bi-check2" items={selected.metCriteria} tone="met" hint="Có bằng chứng rõ trong CV" /><CriteriaColumn title="Đáp ứng một phần" icon="bi-circle-half" items={selected.partialCriteria} tone="partial" hint="Có liên quan nhưng chưa đầy đủ" /><CriteriaColumn title="Còn thiếu" icon="bi-exclamation" items={selected.missingCriteria} tone="missing" hint="Chưa tìm thấy bằng chứng trong CV" /></div><section className="ai-conclusion"><span><i className="bi bi-stars" /></span><div><small>AI SUMMARY</small><h3>Nhận định tổng quan</h3><p>{selected.explanation}</p></div></section></div>}
        </>}
      </section>
    </div>
  </main>
}
