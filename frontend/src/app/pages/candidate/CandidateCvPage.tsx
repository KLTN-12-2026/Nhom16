import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  deleteCandidateCvApi,
  downloadCandidateCvApi,
  listCandidateCvsApi,
  renameCandidateCvApi,
  setDefaultCandidateCvApi,
  uploadCandidateCvApi,
  type CandidateCv,
} from '../../apis/candidate'
import { ApiClientError } from '../../apis/fetch-api'

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
  const [cvs, setCvs] = useState<CandidateCv[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<UploadCvForm>({
    defaultValues: { displayName: '' },
  })
  const selectedFile = watch('file')?.[0]

  const loadCvs = useCallback(() => {
    setLoading(true)
    return listCandidateCvsApi()
      .then((response) => setCvs(response.data.cvs))
      .catch((cause) => setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể tải danh sách CV.') }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { void loadCvs() }, [loadCvs])

  const replaceCv = (updated: CandidateCv) => setCvs((current) => current.map((cv) => cv.id === updated.id ? updated : cv))

  return <main className="candidate-cv-page container">
    <header className="candidate-cv-heading">
      <div>
        <span className="eyebrow">Hồ sơ ứng tuyển</span>
        <h1>CV của tôi</h1>
        <p>Tải lên và quản lý các CV dùng để phân tích hoặc ứng tuyển. Hỗ trợ PDF, DOCX tối đa 5 MB.</p>
      </div>
      <span className="candidate-cv-count">{cvs.length} CV</span>
    </header>

    {feedback && <div className={`auth-alert ${feedback.type === 'success' ? 'auth-alert--success' : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}

    <section className="cv-upload-card" aria-labelledby="upload-cv-title">
      <div className="cv-upload-card__intro">
        <span className="cv-upload-card__icon"><i className="bi bi-cloud-arrow-up" /></span>
        <div><h2 id="upload-cv-title">Tải CV mới</h2><p>File được lưu riêng và chỉ tài khoản của bạn có thể truy cập.</p></div>
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
        <label className="cv-display-name">Tên hiển thị<input type="text" placeholder="Ví dụ: CV Frontend 2026" maxLength={180} {...register('displayName')} /></label>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang tải lên...' : 'Tải CV lên'}</button>
        {(errors.file?.message || errors.displayName?.message) && <small className="cv-form-error">{errors.file?.message || errors.displayName?.message}</small>}
      </form>
    </section>

    <section className="candidate-cv-list" aria-label="Danh sách CV">
      {loading && <div className="cv-empty"><span className="spinner-border text-primary" /><p>Đang tải danh sách CV...</p></div>}
      {!loading && cvs.length === 0 && <div className="cv-empty"><i className="bi bi-file-earmark-person" /><h2>Bạn chưa có CV</h2><p>Tải CV đầu tiên để chuẩn bị cho bước phân tích và ứng tuyển.</p></div>}
      {!loading && cvs.map((cv) => <article className="candidate-cv-card" key={cv.id}>
        <span className={`candidate-cv-card__file ${cv.mimeType === 'application/pdf' ? 'is-pdf' : 'is-docx'}`}><i className={`bi ${cv.mimeType === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-word'}`} /></span>
        <div className="candidate-cv-card__content">
          <div className="candidate-cv-card__title"><h2>{cv.displayName}</h2>{cv.isDefault && <span><i className="bi bi-star-fill" /> Mặc định</span>}</div>
          <p>{cv.originalName} · {formatBytes(cv.sizeBytes)} · Tải lên {new Date(cv.createdAt).toLocaleDateString('vi-VN')}</p>
          <div className="candidate-cv-card__actions">
            <button type="button" className="cv-action" onClick={() => downloadCandidateCvApi(cv).catch((cause) => setFeedback({ type: 'error', message: getErrorMessage(cause, 'Không thể tải CV.') }))}><i className="bi bi-download" /> Tải xuống</button>
            <RenameCv
              cv={cv}
              onSaved={(updated) => { replaceCv(updated); setFeedback({ type: 'success', message: 'Đổi tên CV thành công.' }) }}
              onError={(message) => setFeedback({ type: 'error', message })}
            />
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
      </article>)}
    </section>
  </main>
}
