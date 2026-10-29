import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../../provider/auth-provider'

export default function CandidateProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    title: '',
    bio: '',
    skills: [] as string[],
  })
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('http://localhost:4000/api/candidate/profile', {
      credentials: 'include',
    })
      .then((res) => res.json())
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
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('http://localhost:4000/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Cập nhật thất bại.')
      setFeedback({ type: 'success', message: 'Cập nhật hồ sơ ứng viên thành công!' })
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skillToRemove) }))
  }

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Đang tải hồ sơ ứng viên...</p>
      </main>
    )
  }

  return (
    <main className="container py-4" style={{ maxWidth: 860 }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <span className="eyebrow">Hồ sơ nghề nghiệp</span>
          <h1 className="h3 fw-bold mb-1">Cập nhật hồ sơ ứng viên</h1>
          <p className="text-muted small mb-0">Thông tin chính xác giúp nhà tuyển dụng và AI matching đánh giá tốt hơn.</p>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
          <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />
          {feedback.message}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Họ và tên <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Email đăng ký</label>
              <input
                type="email"
                className="form-control bg-light"
                value={user?.email || ''}
                disabled
              />
              <small className="text-muted">Email dùng để đăng nhập và nhận thông báo.</small>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Số điện thoại liên hệ</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Nhập số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Vị trí / Chức danh mong muốn</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập vị trí mong muốn"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Địa chỉ hiện tại</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập địa chỉ của bạn"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Giới thiệu ngắn về bản thân</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Mô tả tóm tắt kinh nghiệm làm việc, thế mạnh nghề nghiệp và mục tiêu..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Kỹ năng chuyên môn</label>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập kỹ năng và bấm Thêm"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <button type="button" className="btn btn-outline-primary" onClick={addSkill}>
                  <i className="bi bi-plus-lg me-1" /> Thêm
                </button>
              </div>
              {form.skills.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
                      {skill}
                      <button
                        type="button"
                        className="btn-close ms-1"
                        style={{ fontSize: '.65rem' }}
                        onClick={() => removeSkill(skill)}
                      />
                    </span>
                  ))}
                </div>
              ) : (
                <small className="text-muted fst-italic">Chưa có kỹ năng nào. Nhập tên kỹ năng phía trên và bấm Thêm.</small>
              )}
            </div>

            <div className="col-12 pt-3 border-top mt-4 text-end">
              <button type="submit" className="btn btn-primary px-4 py-2 rounded-pill fw-semibold" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2 me-1" /> Lưu thay đổi hồ sơ
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
