import { useState, useEffect, type FormEvent } from 'react'

export default function EmployerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    companyName: '',
    taxCode: '',
    businessLicenseNumber: '',
    logo: '',
    companyPhone: '',
    companyWebsite: '',
    companySize: '50 - 150 nhân viên',
    companyAddress: '',
    representativeName: '',
    representativePosition: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('http://localhost:4000/api/employer/profile', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          const p = res.data
          setForm({
            companyName: p.companyName || '',
            taxCode: p.taxCode || '',
            businessLicenseNumber: p.businessLicenseNumber || '',
            logo: p.logo || '',
            companyPhone: p.companyPhone || '',
            companyWebsite: p.companyWebsite || '',
            companySize: p.companySize || '50 - 150 nhân viên',
            companyAddress: p.companyAddress || '',
            representativeName: p.representativeName || '',
            representativePosition: p.representativePosition || '',
            description: p.description || '',
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
      const res = await fetch('http://localhost:4000/api/employer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Cập nhật thất bại.')
      setFeedback({ type: 'success', message: 'Cập nhật hồ sơ doanh nghiệp thành công!' })
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Đang tải hồ sơ doanh nghiệp...</p>
      </main>
    )
  }

  return (
    <main className="container py-4" style={{ maxWidth: 920 }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <span className="eyebrow">Xác minh & Nhận diện</span>
          <h1 className="h3 fw-bold mb-1">Hồ sơ thông tin doanh nghiệp</h1>
          <p className="text-muted small mb-0">Thông tin minh bạch giúp tạo uy tín và thu hút ứng viên chất lượng cao.</p>
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
              <label className="form-label fw-semibold">Tên doanh nghiệp <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Logo doanh nghiệp (URL)</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://..."
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Mã số thuế</label>
              <input
                type="text"
                className="form-control bg-light"
                value={form.taxCode}
                disabled
              />
              <small className="text-muted">Mã số thuế dùng trong pháp lý và không được tự ý sửa.</small>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Số giấy phép kinh doanh</label>
              <input
                type="text"
                className="form-control bg-light"
                value={form.businessLicenseNumber}
                disabled
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Số điện thoại doanh nghiệp</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Nhập số điện thoại công ty"
                value={form.companyPhone}
                onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Website công ty</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://..."
                value={form.companyWebsite}
                onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Quy mô nhân sự</label>
              <select
                className="form-select"
                value={form.companySize}
                onChange={(e) => setForm({ ...form, companySize: e.target.value })}
              >
                <option value="Dưới 20 nhân viên">Dưới 20 nhân viên</option>
                <option value="20 - 50 nhân viên">20 - 50 nhân viên</option>
                <option value="50 - 150 nhân viên">50 - 150 nhân viên</option>
                <option value="150 - 500 nhân viên">150 - 500 nhân viên</option>
                <option value="Trên 500 nhân viên">Trên 500 nhân viên</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Người đại diện pháp luật</label>
              <input
                type="text"
                className="form-control"
                placeholder="Họ tên người đại diện"
                value={form.representativeName}
                onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Địa chỉ trụ sở <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Địa chỉ trụ sở chính"
                value={form.companyAddress}
                onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Giới thiệu tổng quan về doanh nghiệp</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Mô tả thông tin doanh nghiệp, sứ mệnh, môi trường làm việc..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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
                    <i className="bi bi-check2 me-1" /> Lưu hồ sơ doanh nghiệp
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
