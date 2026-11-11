import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import {
  deleteCandidateCvApi,
  downloadCandidateCvApi,
  extractCandidateCvApi,
  getCandidateCvAvatarUrl,
  listCandidateCvsApi,
  renameCandidateCvApi,
  setDefaultCandidateCvApi,
  uploadCandidateCvApi,
  type CandidateCv,
  type CvQualityAssessment,
} from '../../apis/candidate'
import { ApiClientError } from '../../apis/fetch-api'
import { candidateCvActions } from '../../modules/candidate-cv/redux'
import type { AppDispatch, RootState } from '../../store'

interface UploadCvForm {
  displayName: string
  file: FileList
}

interface RenameCvForm {
  displayName: string
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const getErrorMessage = (cause: unknown, fallback: string) => cause instanceof ApiClientError ? cause.message : fallback

function CvAvatar({ cv }: { cv: CandidateCv }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = cv.hasAvatar && !imageFailed

  return <span className={`candidate-cv-card__avatar ${showImage ? 'has-image' : ''}`}>
    {showImage
      ? <img src={getCandidateCvAvatarUrl(cv.id)} alt={`Ảnh đại diện của ${cv.candidateName || cv.displayName}`} onError={() => setImageFailed(true)} />
      : <i className="bi bi-person-fill" aria-hidden="true" />}
  </span>
}

const extractionLabels: Record<CandidateCv['extractionStatus'], { label: string; icon: string }> = {
  pending: { label: 'Đang chờ phân tích', icon: 'bi-hourglass' },
  processing: { label: 'Đang phân tích', icon: 'bi-arrow-repeat' },
  completed: { label: 'Đã phân tích', icon: 'bi-check-circle-fill' },
  partial: { label: 'Cần bổ sung', icon: 'bi-exclamation-circle' },
  failed: { label: 'Không thể phân tích', icon: 'bi-x-circle' },
}

function CvDetailSection({ icon, title, items, emptyText, variant }: {
  icon: string
  title: string
  items: string[]
  emptyText: string
  variant: 'education' | 'experience' | 'skills' | 'certificates' | 'projects'
}) {
  return <section className={`cv-detail cv-detail--${variant}`}>
    <h3><i className={`bi ${icon}`} /> {title}<span>{items.length}</span></h3>
    {items.length > 0
      ? variant === 'skills'
        ? <div className="cv-skill-list">{items.map((item) => <span key={item}>{item}</span>)}</div>
        : <ul>{items.map((item) => <li key={item}><i className="bi bi-check2" /> <span>{item}</span></li>)}</ul>
      : <p className="cv-detail__empty">{emptyText}</p>}
  </section>
}

const qualityCriteria = [
  ['completeness', 'Đầy đủ'],
  ['clarity', 'Rõ ràng'],
  ['consistency', 'Nhất quán'],
  ['evidence', 'Thể hiện năng lực'],
] as const

function CvQualityPanel({ assessment }: { assessment: CvQualityAssessment }) {
  return <section className="cv-quality" aria-label="Đánh giá chất lượng CV">
    <header>
      <div className="cv-quality__score" style={{ '--quality-score': `${assessment.overallScore * 3.6}deg` } as CSSProperties}>
        <span><strong>{assessment.overallScore}</strong><small>/100</small></span>
      </div>
      <div><span className="cv-quality__eyebrow"><i className="bi bi-stars" /> AI đánh giá chất lượng</span><h3>{assessment.overallScore >= 80 ? 'Hồ sơ nổi bật' : assessment.overallScore >= 60 ? 'Hồ sơ khá tốt' : 'Hồ sơ cần hoàn thiện'}</h3><p>{assessment.disclaimer}</p></div>
    </header>
    <div className="cv-quality__criteria">{qualityCriteria.map(([key, label]) => <article key={key}>
      <div><strong>{label}</strong><span>{assessment.criteria[key].score}/100</span></div>
      <span className="cv-quality__bar"><i style={{ width: `${assessment.criteria[key].score}%` }} /></span>
      <p>{assessment.criteria[key].summary}</p>
    </article>)}</div>
    <div className="cv-quality__insights">
      <article><h4><i className="bi bi-check-circle" /> Điểm mạnh</h4><ul>{assessment.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article><h4><i className="bi bi-exclamation-circle" /> Điểm cần cải thiện</h4><ul>{assessment.limitations.map((item) => <li key={item}>{item}</li>)}</ul></article>
    </div>
    <footer>Đánh giá phiên bản {assessment.analysisVersion} · {new Date(assessment.assessedAt).toLocaleString('vi-VN')}</footer>
  </section>
}

function RenameCv({ cv, onSaved, onError }: { cv: CandidateCv; onSaved: (updated: CandidateCv) => void; onError: (message: string) => void }) {
  const [editing, setEditing] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RenameCvForm>({
    defaultValues: { displayName: cv.displayName },
  })

  useEffect(() => reset({ displayName: cv.displayName }), [cv.displayName, reset])

  if (!editing) {
    return <button type="button" className="cv-action" onClick={() => setEditing(true)}><i className="bi bi-pencil" /> Đổi tên</button>
  }

  return <form className="cv-rename-form" onSubmit={handleSubmit(async ({ displayName }) => {
    try {
      const response = await renameCandidateCvApi(cv.id, displayName)
      onSaved(response.data.cv)
      setEditing(false)
    } catch (cause) {
      onError(getErrorMessage(cause, 'Không thể đổi tên CV.'))
    }
  })}>
    <input
      className={errors.displayName ? 'is-invalid' : ''}
      aria-label="Tên CV"
      {...register('displayName', {
        required: 'Vui lòng nhập tên CV.',
        maxLength: { value: 180, message: 'Tên CV không được vượt quá 180 ký tự.' },
      })}
    />
    <button type="submit" disabled={isSubmitting} aria-label="Lưu tên CV"><i className="bi bi-check-lg" /></button>
    <button type="button" onClick={() => { reset(); setEditing(false) }} aria-label="Hủy đổi tên"><i className="bi bi-x-lg" /></button>
    {errors.displayName && <small>{errors.displayName.message}</small>}
  </form>
}

export default function CandidateCvPage() {
  const dispatch = useDispatch<AppDispatch>()
  const qualityState = useSelector((state: RootState) => state.candidateCv)
  const [cvs, setCvs] = useState<CandidateCv[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<UploadCvForm>({
    defaultValues: { displayName: '' },
  })
  const selectedFile = watch('file')?.[0]

  const loadCvs = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return listCandidateCvsApi()
      .then((response) => setCvs(response.data.cvs))
      .catch((cause) => setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể tải danh sách CV.') }))
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => { void loadCvs() }, [loadCvs])

  useEffect(() => {
    if (!cvs.some((cv) => ['pending', 'processing'].includes(cv.extractionStatus))) return undefined
    const timer = window.setInterval(() => { void loadCvs(true) }, 3000)
    return () => window.clearInterval(timer)
  }, [cvs, loadCvs])

  const replaceCv = (updated: CandidateCv) => setCvs((current) => current.map((cv) => cv.id === updated.id ? updated : cv))
  const analyzedCvs = cvs.filter((cv) => cv.extractionStatus === 'completed').length
  const extractedSkills = new Set(cvs.flatMap((cv) => cv.skills || [])).size
  const extractedProjects = cvs.reduce((total, cv) => total + (cv.projects?.length || 0), 0)

  return <main className="candidate-cv-page container">
    <header className="candidate-cv-heading">
      <div>
        <span className="eyebrow">Trung tâm hồ sơ ứng tuyển</span>
        <h1>CV của tôi</h1>
        <p>Quản lý CV, kiểm tra dữ liệu hệ thống đã nhận diện và chuẩn bị hồ sơ tốt hơn trước khi ứng tuyển.</p>
      </div>
      <span className="candidate-cv-count">{cvs.length} CV</span>
    </header>

    <section className="cv-overview" aria-label="Tổng quan CV">
      <article><span><i className="bi bi-file-earmark-check" /></span><div><strong>{analyzedCvs}/{cvs.length}</strong><small>CV đã phân tích</small></div></article>
      <article><span><i className="bi bi-stars" /></span><div><strong>{extractedSkills}</strong><small>Kỹ năng được nhận diện</small></div></article>
      <article><span><i className="bi bi-kanban" /></span><div><strong>{extractedProjects}</strong><small>Dự án trong hồ sơ</small></div></article>
      <div className="cv-overview__note"><i className="bi bi-lightbulb" /><p><strong>Mẹo hoàn thiện CV</strong><span>Đặt tên rõ ràng cho từng mục Kỹ năng, Chứng chỉ và Dự án để hệ thống đọc chính xác hơn.</span></p></div>
    </section>

    {feedback && <div className={`auth-alert ${feedback.type === 'success' ? 'auth-alert--success' : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}

    <section className="cv-upload-card" aria-labelledby="upload-cv-title">
      <div className="cv-upload-card__intro">
        <span className="cv-upload-card__icon"><i className="bi bi-cloud-arrow-up" /></span>
        <div><h2 id="upload-cv-title">Tải CV mới</h2><p>PDF hoặc DOCX tối đa 5 MB. Hệ thống tự động đọc ảnh, thông tin liên hệ và nội dung nghề nghiệp.</p></div>
      </div>
      <form onSubmit={handleSubmit(async ({ file, displayName }) => {
        setFeedback(null)
        try {
          const response = await uploadCandidateCvApi(file[0], displayName)
          setCvs((current) => [response.data.cv, ...current.map((cv) => ({ ...cv, isDefault: response.data.cv.isDefault ? false : cv.isDefault }))])
          reset()
          setFeedback({ type: 'success', message: 'Tải CV lên thành công.' })
        } catch (cause) {
          setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể tải CV lên.') })
        }
      })}>
        <label className="cv-file-picker">
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            {...register('file', {
              required: 'Vui lòng chọn file CV.',
              validate: {
                size: (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024 || 'CV không được vượt quá 5 MB.',
                type: (files) => !files?.[0] || ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(files[0].type) || 'CV chỉ chấp nhận PDF hoặc DOCX.',
              },
            })}
          />
          <i className="bi bi-file-earmark-arrow-up" />
          <span>{selectedFile ? selectedFile.name : 'Chọn file PDF hoặc DOCX'}</span>
        </label>
        <label className="cv-display-name">Tên hiển thị<input type="text" placeholder="Nhập tên hiển thị CV" maxLength={180} {...register('displayName')} /></label>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang tải lên...' : 'Tải CV lên'}</button>
        {(errors.file?.message || errors.displayName?.message) && <small className="cv-form-error">{errors.file?.message || errors.displayName?.message}</small>}
      </form>
    </section>

    <section className="candidate-cv-list" aria-label="Danh sách CV">
      {loading && <div className="cv-empty"><span className="spinner-border text-primary" /><p>Đang tải danh sách CV...</p></div>}
      {!loading && cvs.length === 0 && <div className="cv-empty"><i className="bi bi-file-earmark-person" /><h2>Bạn chưa có CV</h2><p>Tải CV đầu tiên để chuẩn bị cho bước phân tích và ứng tuyển.</p></div>}
      {!loading && cvs.map((cv) => {
        const qualityAssessment = qualityState.assessmentByCvId[cv.id] || cv.qualityAssessment
        const qualityError = qualityState.errorByCvId[cv.id]
        const isAssessing = qualityState.assessingCvId === cv.id
        return <article className={`candidate-cv-card candidate-cv-card--${cv.extractionStatus}`} key={cv.id}>
        <div className="candidate-cv-card__topline">
          <div className="candidate-cv-card__title"><h2>{cv.displayName}</h2>{cv.isDefault && <span><i className="bi bi-star-fill" /> CV mặc định</span>}</div>
          <span className={`cv-analysis-status cv-analysis-status--${cv.extractionStatus}`}><i className={`bi ${extractionLabels[cv.extractionStatus].icon}`} /> {extractionLabels[cv.extractionStatus].label}</span>
        </div>
        <div className="candidate-cv-card__content">
          <div className="candidate-cv-card__identity">
            <CvAvatar cv={cv} />
            <div className="candidate-cv-card__profile">
              {['pending', 'processing'].includes(cv.extractionStatus) && <span><i className="bi bi-hourglass-split" /> Hệ thống đang đọc nội dung và ảnh trong CV</span>}
              <strong>{cv.extractionStatus === 'failed' ? 'Không nhận diện được nội dung CV' : cv.candidateName || 'Chưa xác định được họ tên'}</strong>
              {cv.headline && <span className="candidate-cv-card__headline">{cv.headline}</span>}
              <div>
                {cv.candidateEmail && <span><i className="bi bi-envelope" /> {cv.candidateEmail}</span>}
                {cv.candidatePhone && <span><i className="bi bi-telephone" /> {cv.candidatePhone}</span>}
                {!cv.candidateEmail && !cv.candidatePhone && !['pending', 'processing'].includes(cv.extractionStatus) && <span><i className="bi bi-info-circle" /> {cv.extractionStatus === 'failed' ? 'File không có đủ dấu hiệu của một CV' : 'Chưa đọc được thông tin liên hệ trong CV'}</span>}
              </div>
            </div>
          </div>
          <div className="candidate-cv-card__details">
            <CvDetailSection icon="bi-mortarboard" title="Học vấn" items={cv.education || []} emptyText="Chưa nhận diện được thông tin học vấn." variant="education" />
            <CvDetailSection icon="bi-briefcase" title="Kinh nghiệm" items={cv.experience || []} emptyText="Chưa nhận diện được kinh nghiệm làm việc." variant="experience" />
            <CvDetailSection icon="bi-lightning-charge" title="Kỹ năng" items={cv.skills || []} emptyText="Chưa nhận diện được kỹ năng trong CV." variant="skills" />
            <CvDetailSection icon="bi-patch-check" title="Chứng chỉ" items={cv.certificates || []} emptyText="Chưa có thông tin chứng chỉ." variant="certificates" />
            <CvDetailSection icon="bi-kanban" title="Dự án nổi bật" items={cv.projects || []} emptyText="Chưa nhận diện được dự án trong CV." variant="projects" />
          </div>
          <div className="candidate-cv-card__meta"><span><i className={`bi ${cv.mimeType.includes('pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-word'}`} /> {cv.originalName}</span><span>{formatBytes(cv.sizeBytes)}</span><span>Tải lên {new Date(cv.createdAt).toLocaleDateString('vi-VN')}</span>{cv.analyzedAt && <span>Phân tích lần {cv.analysisVersion} · {new Date(cv.analyzedAt).toLocaleString('vi-VN')}</span>}</div>
          {qualityAssessment && <CvQualityPanel assessment={qualityAssessment} />}
          {qualityError && <p className="cv-form-error"><i className="bi bi-exclamation-triangle" /> {qualityError}</p>}
          {cv.analysisError && <p className="cv-form-error"><i className="bi bi-exclamation-triangle" /> {cv.analysisError}</p>}
          <div className="candidate-cv-card__actions">
            <button type="button" className="cv-action" onClick={() => downloadCandidateCvApi(cv).catch((cause) => setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể tải CV.') }))}><i className="bi bi-download" /> Tải xuống</button>
            <RenameCv
              cv={cv}
              onSaved={(updated) => { replaceCv(updated); setFeedback({ type: 'success', message: 'Đổi tên CV thành công.' }) }}
              onError={(message) => setFeedback({ type: 'error', message })}
            />
            <button type="button" className="cv-action" disabled={busyId !== null} onClick={async () => {
              setBusyId(cv.id)
              try {
                const response = await extractCandidateCvApi(cv.id)
                replaceCv(response.data.cv)
                setFeedback({ type: 'success', message: 'Đã đọc lại thông tin và ảnh trong CV.' })
              } catch (cause) {
                setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể đọc thông tin CV.') })
              } finally { setBusyId(null) }
            }}><i className="bi bi-arrow-repeat" /> Đọc lại thông tin</button>
            {['completed', 'partial'].includes(cv.extractionStatus) && <button type="button" className="cv-action cv-action--ai" disabled={qualityState.assessingCvId !== null} onClick={() => dispatch(candidateCvActions.qualityRequested({ cvId: cv.id, force: Boolean(qualityAssessment) }))}><i className={`bi ${isAssessing ? 'bi-arrow-repeat' : 'bi-stars'}`} /> {isAssessing ? 'AI đang đánh giá...' : qualityAssessment ? 'Đánh giá lại chất lượng' : 'Đánh giá chất lượng'}</button>}
            {!cv.isDefault && <button type="button" className="cv-action" disabled={busyId !== null} onClick={async () => {
              setBusyId(cv.id)
              try {
                const response = await setDefaultCandidateCvApi(cv.id)
                setCvs((current) => current.map((item) => ({ ...item, isDefault: item.id === response.data.cv.id })))
                setFeedback({ type: 'success', message: 'Đã đặt CV mặc định.' })
              } catch (cause) {
                setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể đặt CV mặc định.') })
              } finally { setBusyId(null) }
            }}><i className="bi bi-star" /> Đặt mặc định</button>}
            <button type="button" className="cv-action cv-action--danger" disabled={busyId !== null} onClick={async () => {
              if (!window.confirm(`Xóa “${cv.displayName}”?`)) return
              setBusyId(cv.id)
              try {
                await deleteCandidateCvApi(cv.id)
                await loadCvs()
                setFeedback({ type: 'success', message: 'Đã xóa CV.' })
              } catch (cause) {
                setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể xóa CV.') })
              } finally { setBusyId(null) }
            }}><i className="bi bi-trash" /> Xóa</button>
          </div>
        </div>
      </article>})}
    </section>
  </main>
}
