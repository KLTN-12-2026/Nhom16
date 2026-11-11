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
  type CvImprovementSuggestion,
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

function CvQualityPanel({
  assessment,
  hasSuggestion,
  isSuggesting,
  suggestDisabled,
  suggestionError,
  customRequest,
  onCustomRequestChange,
  onSuggestImprovement,
}: {
  assessment: CvQualityAssessment
  hasSuggestion: boolean
  isSuggesting: boolean
  suggestDisabled: boolean
  suggestionError?: string
  customRequest: string
  onCustomRequestChange: (value: string) => void
  onSuggestImprovement: () => void
}) {
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
    <footer className="cv-quality__footer">
      <span>Đánh giá phiên bản {assessment.analysisVersion} · {new Date(assessment.assessedAt).toLocaleString('vi-VN')}</span>
      <div className="cv-quality__improve-controls">
        <input
          type="text"
          className="cv-improvement__input"
          aria-label="Yêu cầu cải thiện CV tùy chọn"
          placeholder="Yêu cầu thêm (VD: nhấn mạnh Backend Node.js)..."
          maxLength={300}
          value={customRequest}
          onChange={(event) => onCustomRequestChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            if (!suggestDisabled) onSuggestImprovement()
          }}
        />
        <button type="button" className="cv-action cv-action--ai" disabled={suggestDisabled} onClick={onSuggestImprovement}>
          <i className={`bi ${isSuggesting ? 'bi-arrow-repeat' : 'bi-magic'}`} />
          {isSuggesting ? 'AI đang tạo gợi ý...' : hasSuggestion ? 'Làm mới gợi ý cải thiện' : 'Xem gợi ý cải thiện'}
        </button>
      </div>
    </footer>
    {suggestionError && <p className="cv-improvement__error" role="alert"><i className="bi bi-exclamation-triangle-fill" /> {suggestionError}</p>}
  </section>
}

function SectionAdviceCard({ icon, title, advice }: {
  icon: string
  title: string
  advice: { reason: string; actionableEdit: string } | null
}) {
  if (!advice) return null
  return <article className="cv-improvement__block">
    <h4><i className={`bi ${icon}`} /> {title}</h4>
    <div className="cv-improvement__advice">
      <p><strong>Lý do:</strong> {advice.reason}</p>
      <p><strong>Hướng chỉnh sửa:</strong> {advice.actionableEdit}</p>
    </div>
  </article>
}

function CvImprovementPanel({ suggestion }: { suggestion: CvImprovementSuggestion }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { missingContacts, spellingOrExpression, missingSections } = suggestion.warnings
  const hasWarnings = missingContacts.length > 0 || spellingOrExpression.length > 0 || missingSections.length > 0

  const handleCopy = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => current === key ? null : current), 1800)
    }).catch(() => undefined)
  }

  return <section className="cv-improvement" aria-label="Gợi ý cải thiện CV">
    <header>
      <span className="cv-improvement__badge"><i className="bi bi-magic" /></span>
      <div>
        <span className="cv-quality__eyebrow">AI gợi ý cải thiện CV · Định hướng: {suggestion.targetRole}</span>
        <h3>Đề xuất chỉnh sửa theo 5 phần: Tóm tắt, Kinh nghiệm, Kỹ năng, Học vấn &amp; Trình bày</h3>
        <p>{suggestion.disclaimer}</p>
      </div>
    </header>

    <div className="cv-improvement__body">
      <article className="cv-improvement__block">
        <div className="cv-improvement__block-head">
          <h4><i className="bi bi-bullseye" /> 1. Tóm tắt / Mục tiêu nghề nghiệp</h4>
          <button type="button" className="cv-copy-btn" onClick={() => handleCopy('objective', suggestion.objectiveRewrite.suggestedText)}>
            <i className={`bi ${copiedKey === 'objective' ? 'bi-check2' : 'bi-clipboard'}`} /> {copiedKey === 'objective' ? 'Đã sao chép' : 'Sao chép'}
          </button>
        </div>
        <small className="cv-improvement__note">{suggestion.objectiveRewrite.currentStatus}</small>
        <blockquote className="cv-improvement__rewrite">{suggestion.objectiveRewrite.suggestedText}</blockquote>
        <small className="cv-improvement__rationale"><i className="bi bi-lightbulb" /> <span><strong>Lý do:</strong> {suggestion.objectiveRewrite.rationale}</span></small>
      </article>

      <article className="cv-improvement__block">
        <h4><i className="bi bi-briefcase" /> 2. Kinh nghiệm làm việc</h4>
        {suggestion.experienceRewrites.length > 0 ? <div className="cv-improvement__rewrites">
          {suggestion.experienceRewrites.map((item, index) => {
            const key = `exp-${index}`
            return <div className="cv-improvement__diff" key={key}>
              <div className="cv-improvement__diff-orig"><span>Hiện tại:</span><p>{item.original}</p></div>
              <div className="cv-improvement__diff-new">
                <div>
                  <span>Hướng chỉnh sửa:</span>
                  <button type="button" className="cv-copy-btn" onClick={() => handleCopy(key, item.improved)}>
                    <i className={`bi ${copiedKey === key ? 'bi-check2' : 'bi-clipboard'}`} /> {copiedKey === key ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
                <p>{item.improved}</p>
              </div>
              <small className="cv-improvement__rationale"><i className="bi bi-check2-circle" /> <span><strong>Lý do:</strong> {item.focusNote}</span></small>
            </div>
          })}
        </div> : <p className="cv-detail__empty">Chưa có mục kinh nghiệm hoặc dự án để viết lại; bạn hãy bổ sung 1–2 dự án kèm vai trò và kết quả đạt được.</p>}
      </article>

      <article className="cv-improvement__block">
        <h4><i className="bi bi-tags" /> 3. Kỹ năng nên bổ sung</h4>
        {suggestion.recommendedSkills.length > 0 ? <div className="cv-improvement__skills">
          {suggestion.recommendedSkills.map((item) => <div className="cv-improvement__skill-item" key={item.keyword}>
            <strong>{item.keyword}</strong>
            <span><strong>Lý do:</strong> {item.reason}</span>
          </div>)}
        </div> : <p className="cv-detail__empty">Danh mục kỹ năng hiện tại đã khá đầy đủ cho vị trí định hướng.</p>}
      </article>

      <div className="cv-improvement__advice-grid">
        <SectionAdviceCard icon="bi-mortarboard" title="4. Học vấn" advice={suggestion.educationSuggestion} />
        <SectionAdviceCard icon="bi-layout-text-window-reverse" title="5. Trình bày & Bố cục" advice={suggestion.presentationSuggestion} />
      </div>

      <article className={`cv-improvement__block ${hasWarnings ? 'cv-improvement__block--warn' : 'cv-improvement__block--ok'}`}>
        <h4><i className={`bi ${hasWarnings ? 'bi-exclamation-triangle' : 'bi-shield-check'}`} /> Cảnh báo chính tả &amp; thông tin còn thiếu</h4>
        {!hasWarnings && <p className="cv-detail__empty">Không phát hiện thiếu thông tin liên hệ hay lỗi diễn đạt nghiêm trọng.</p>}
        {missingContacts.length > 0 && <div className="cv-improvement__warn-group">
          <strong>Thông tin liên hệ bị thiếu</strong>
          <ul>{missingContacts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>}
        {spellingOrExpression.length > 0 && <div className="cv-improvement__warn-group">
          <strong>Lỗi chính tả &amp; cách diễn đạt</strong>
          <ul>{spellingOrExpression.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>}
        {missingSections.length > 0 && <div className="cv-improvement__warn-group">
          <strong>Mục thông tin cần bổ sung</strong>
          <ul>{missingSections.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>}
      </article>
    </div>

    <footer>Gợi ý cho phiên bản {suggestion.analysisVersion} · {new Date(suggestion.generatedAt).toLocaleString('vi-VN')}</footer>
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
  const [customRequests, setCustomRequests] = useState<Record<number, string>>({})
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

  const replaceCv = (updated: CandidateCv) => setCvs((current) => current.map((cv) => {
    if (cv.id !== updated.id) return cv
    const sameVersion = updated.analysisVersion === cv.analysisVersion
    return {
      ...updated,
      qualityAssessment: updated.qualityAssessment || (sameVersion ? cv.qualityAssessment : null),
      improvementSuggestion: updated.improvementSuggestion || (sameVersion ? cv.improvementSuggestion : null),
    }
  }))
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
        const reduxAssessment = qualityState.assessmentByCvId[cv.id]
        const qualityAssessment = reduxAssessment?.analysisVersion === cv.analysisVersion ? reduxAssessment : cv.qualityAssessment
        const qualityError = qualityState.errorByCvId[cv.id]
        const isAssessing = qualityState.assessingCvId === cv.id
        const reduxSuggestion = qualityState.suggestionByCvId[cv.id]
        const improvementSuggestion = reduxSuggestion?.analysisVersion === cv.analysisVersion ? reduxSuggestion : cv.improvementSuggestion
        const suggestionError = qualityState.suggestionErrorByCvId[cv.id]
        const isSuggesting = qualityState.suggestingCvId === cv.id
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
          {qualityAssessment && <CvQualityPanel
            assessment={qualityAssessment}
            hasSuggestion={Boolean(improvementSuggestion)}
            isSuggesting={isSuggesting}
            suggestDisabled={qualityState.suggestingCvId !== null || qualityState.assessingCvId === cv.id}
            suggestionError={suggestionError}
            customRequest={customRequests[cv.id] || ''}
            onCustomRequestChange={(value) => setCustomRequests((current) => ({ ...current, [cv.id]: value }))}
            onSuggestImprovement={() => dispatch(candidateCvActions.improvementRequested({
              cvId: cv.id,
              force: Boolean(improvementSuggestion),
              customRequest: customRequests[cv.id] || '',
            }))}
          />}
          {improvementSuggestion && <CvImprovementPanel suggestion={improvementSuggestion} />}
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
