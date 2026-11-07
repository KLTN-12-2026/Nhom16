import { useState, useEffect, useId, type FormEvent, type ChangeEvent } from 'react'
import {
  getCandidateProfileApi,
  updateCandidateProfileApi,
  uploadCandidateAvatarApi,
  deleteCandidateAvatarApi,
  getCandidateAvatarUrl,
} from '../../apis/candidate'
import { ApiClientError } from '../../apis/fetch-api'
import { useAuth } from '../../provider/auth-provider'

const POPULAR_SKILL_SUGGESTIONS = [
  'JavaScript',
  'TypeScript',
  'ReactJS',
  'Node.js',
  'Python',
  'Java',
  'SQL',
  'Git',
  'HTML5/CSS3',
  'Docker',
  'RESTful API',
  'Figma',
  'UI/UX Design',
  'Agile/Scrum',
  'Problem Solving',
  'Teamwork',
]

export default function CandidateProfilePage() {
  const { user } = useAuth()
  const avatarInputId = useId()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now())
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    title: '',
    bio: '',
    skills: [] as string[],
  })
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    getCandidateProfileApi()
      .then((res) => {
        if (res.data) {
          const u = res.data
          const p = u.candidateProfile || {}
          setForm({
            fullName: u.fullName || '',
            phone: p.phone || '',
            address: p.address || '',
            title: p.title || '',
            bio: p.bio || '',
            skills: Array.isArray(p.skills) ? p.skills : [],
          })
          setHasCustomAvatar(Boolean(p.avatar))
        }
      })
      .catch((err) => {
        const message = err instanceof ApiClientError ? err.message : 'Không thể tải thông tin hồ sơ.'
        setFeedback({ type: 'error', message })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const calculateCompleteness = () => {
    let score = 0
    if (form.fullName.trim()) score += 20
    if (form.phone.trim()) score += 15
    if (form.title.trim()) score += 15
    if (form.address.trim()) score += 10
    if (form.bio.trim()) score += 15
    if (form.skills.length > 0) score += 15
    if (hasCustomAvatar) score += 10
    return Math.min(100, score)
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn file ảnh có định dạng JPG, PNG hoặc WEBP.' })
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Kích thước ảnh đại diện không được vượt quá 5MB.' })
      e.target.value = ''
      return
    }

    setUploadingAvatar(true)
    setFeedback(null)

    try {
      await uploadCandidateAvatarApi(file)
      setHasCustomAvatar(true)
      setAvatarTimestamp(Date.now())
      setFeedback({ type: 'success', message: 'Cập nhật ảnh đại diện thành công!' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Không thể tải ảnh đại diện lên.'
      setFeedback({ type: 'error', message })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    if (!hasCustomAvatar) return
    setUploadingAvatar(true)
    setFeedback(null)

    try {
      await deleteCandidateAvatarApi()
      setHasCustomAvatar(false)
      setAvatarTimestamp(Date.now())
      setFeedback({ type: 'success', message: 'Đã xóa ảnh đại diện.' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Không thể xóa ảnh đại diện.'
      setFeedback({ type: 'error', message })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      await updateCandidateProfileApi(form)
      setFeedback({ type: 'success', message: 'Cập nhật hồ sơ ứng viên thành công!' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Cập nhật thất bại. Vui lòng thử lại.'
      setFeedback({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (skillToAdd?: string) => {
    const targetSkill = (skillToAdd || skillInput).trim()
    if (targetSkill && !form.skills.includes(targetSkill)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, targetSkill] }))
      if (!skillToAdd) setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skillToRemove) }))
  }

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-success spinner-border-lg" role="status" />
        <p className="mt-3 text-muted fw-semibold">Đang tải hồ sơ ứng viên...</p>
      </main>
    )
  }

  const completeness = calculateCompleteness()
  const avatarUrl = getCandidateAvatarUrl(user?.id, avatarTimestamp)
  const initialLetter = (form.fullName || user?.fullName || 'U').charAt(0).toUpperCase()

  return (
    <main className="container candidate-profile-page">
      <div className="candidate-profile-heading">
        <div>
          <span className="eyebrow">Hồ sơ nghề nghiệp</span>
          <h1>Quản lý hồ sơ cá nhân</h1>
          <p>Hoàn thiện thông tin cá nhân và ảnh đại diện để gây ấn tượng mạnh với nhà tuyển dụng và tối ưu AI matching.</p>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success border-success-subtle' : 'alert-danger border-danger-subtle'} alert-dismissible fade show rounded-4 mb-4 shadow-sm`} role="alert">
          <div className="d-flex align-items-center">
            <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-5 me-2`} />
            <span className="fw-medium">{feedback.message}</span>
            <button type="button" className="btn-close ms-auto" aria-label="Đóng" onClick={() => setFeedback(null)} />
          </div>
        </div>
      )}

      <div className="candidate-profile-grid">
        <aside className="profile-card profile-sidebar">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-frame">
              {uploadingAvatar ? (
                <div className="spinner-border text-success" role="status" />
              ) : hasCustomAvatar ? (
                <img
                  src={avatarUrl}
                  crossOrigin="anonymous"
                  alt={`Ảnh đại diện của ${form.fullName || 'ứng viên'}`}
                  onError={() => setHasCustomAvatar(false)}
                />
              ) : (
                <span className="avatar-initials">{initialLetter}</span>
              )}
            </div>

            <label
              htmlFor={avatarInputId}
              className="avatar-upload-label"
              title="Tải lên hoặc đổi ảnh đại diện"
            >
              <i className="bi bi-camera-fill" />
              <input
                id={avatarInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>

            {hasCustomAvatar && !uploadingAvatar && (
              <button
                type="button"
                className="avatar-delete-btn"
                title="Xóa ảnh đại diện"
                aria-label="Xóa ảnh đại diện"
                onClick={handleDeleteAvatar}
              >
                <i className="bi bi-trash3-fill" />
              </button>
            )}
          </div>

          <h2 className="h5 fw-bold text-dark mb-1">{form.fullName || 'Chưa đặt họ tên'}</h2>
          <p className="text-muted small mb-2">{form.title || 'Ứng viên tìm việc'}</p>

          <div className="profile-completeness">
            <div className="completeness-header">
              <span>Độ hoàn thiện hồ sơ</span>
              <span className="pct">{completeness}%</span>
            </div>
            <progress
              className="completeness-progress"
              value={completeness}
              max={100}
              aria-label="Độ hoàn thiện hồ sơ"
            />
          </div>

          <div className="profile-ai-tip mb-3">
            <i className="bi bi-lightbulb-fill" />
            <div>
              <strong>Gợi ý AI Matching:</strong>
              <div className="mt-1">
                {completeness < 70
                  ? 'Bổ sung đầy đủ số điện thoại, chức danh và kỹ năng để hệ thống tự động kết nối với công việc phù hợp nhất.'
                  : 'Hồ sơ đã đạt tiêu chuẩn rất tốt! Các nhà tuyển dụng có thể dễ dàng nhận diện và liên hệ phỏng vấn.'}
              </div>
            </div>
          </div>

          <div className="text-start border-top pt-3 small text-muted">
            <div className="mb-2 d-flex align-items-center gap-2">
              <i className="bi bi-envelope text-success" />
              <span className="text-truncate">{user?.email || 'Chưa có email'}</span>
            </div>
            <div className="mb-2 d-flex align-items-center gap-2">
              <i className="bi bi-telephone text-success" />
              <span>{form.phone || 'Chưa cập nhật SĐT'}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt text-success" />
              <span className="text-truncate">{form.address || 'Chưa cập nhật địa chỉ'}</span>
            </div>
          </div>
        </aside>

        <section className="profile-card">
          <form onSubmit={handleSubmit}>
            <div className="profile-section">
              <h3 className="profile-section-title">
                <i className="bi bi-person-badge" /> Thông tin cơ bản & liên hệ
              </h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="candidate-fullName" className="form-label fw-semibold">
                    Họ và tên <span className="text-danger">*</span>
                  </label>
                  <input
                    id="candidate-fullName"
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập họ và tên"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="candidate-email" className="form-label fw-semibold">Email đăng ký tài khoản</label>
                  <div className="input-group">
                    <input
                      id="candidate-email"
                      type="email"
                      className="form-control bg-light text-muted rounded-3"
                      placeholder="Email đăng ký"
                      title="Email đăng ký tài khoản"
                      value={user?.email || ''}
                      disabled
                    />
                    <span className="input-group-text bg-light text-success border-start-0">
                      <i className="bi bi-shield-check" title="Đã bảo vệ" />
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="candidate-phone" className="form-label fw-semibold">Số điện thoại liên hệ</label>
                  <input
                    id="candidate-phone"
                    type="tel"
                    className="form-control rounded-3"
                    placeholder="Nhập số điện thoại"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="candidate-address" className="form-label fw-semibold">Địa chỉ hiện tại</label>
                  <input
                    id="candidate-address"
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập địa chỉ"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="profile-section-title">
                <i className="bi bi-briefcase" /> Định hướng nghề nghiệp
              </h3>
              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="candidate-title" className="form-label fw-semibold">Vị trí / Chức danh mong muốn</label>
                  <input
                    id="candidate-title"
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập vị trí mong muốn"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="candidate-bio" className="form-label fw-semibold mb-0">Giới thiệu ngắn về bản thân</label>
                    <small className="text-muted">{form.bio.length}/2000 ký tự</small>
                  </div>
                  <textarea
                    id="candidate-bio"
                    className="form-control rounded-3"
                    rows={4}
                    maxLength={2000}
                    placeholder="Nhập thông tin giới thiệu bản thân, mục tiêu nghề nghiệp..."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="profile-section-title">
                <i className="bi bi-tools" /> Kỹ năng chuyên môn
              </h3>

              <div className="input-group mb-3">
                <input
                  id="candidate-skill-input"
                  type="text"
                  className="form-control rounded-start-3"
                  placeholder="Nhập kỹ năng"
                  aria-label="Nhập kỹ năng chuyên môn"
                  title="Nhập kỹ năng chuyên môn"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-success px-4 rounded-end-3 fw-semibold"
                  onClick={() => addSkill()}
                >
                  <i className="bi bi-plus-lg me-1" /> Thêm kỹ năng
                </button>
              </div>

              {form.skills.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {form.skills.map((skill) => (
                    <span key={skill} className="skill-badge">
                      <span>{skill}</span>
                      <button
                        type="button"
                        aria-label={`Xóa kỹ năng ${skill}`}
                        onClick={() => removeSkill(skill)}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted fst-italic small mb-3">Chưa có kỹ năng nào.</p>
              )}

              <div>
                <span className="text-muted small fw-semibold d-block mb-2">Gợi ý kỹ năng phổ biến:</span>
                <div className="d-flex flex-wrap gap-2">
                  {POPULAR_SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 10).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="skill-suggest-tag"
                      onClick={() => addSkill(suggestion)}
                    >
                      <i className="bi bi-plus" /> {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end align-items-center gap-3 pt-3">
              <button
                type="submit"
                className="btn btn-cv-save d-inline-flex align-items-center gap-2"
                disabled={saving || uploadingAvatar}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Đang lưu hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle fs-5" />
                    <span>Lưu thay đổi hồ sơ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
