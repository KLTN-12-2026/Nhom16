import { useState, useEffect, useId, type FormEvent, type ChangeEvent } from 'react'
import {
  getEmployerProfileApi,
  updateEmployerProfileApi,
  uploadEmployerLogoApi,
  deleteEmployerLogoApi,
  getEmployerLogoUrl,
  type EmployerProfile,
} from '../../apis/employer'
import { ApiClientError } from '../../apis/fetch-api'
import { useAuth } from '../../provider/auth-provider'

export default function EmployerProfilePage() {
  const { user } = useAuth()
  const logoInputId = useId()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoTimestamp, setLogoTimestamp] = useState<number>(Date.now())
  const [hasCustomLogo, setHasCustomLogo] = useState(false)
  const [profileData, setProfileData] = useState<EmployerProfile | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  useEffect(() => {
    getEmployerProfileApi()
      .then((res) => {
        if (res.data) {
          const p = res.data
          setProfileData(p)
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
          setHasCustomLogo(Boolean(p.logo))
        }
      })
      .catch((err) => {
        const message = err instanceof ApiClientError ? err.message : 'Không thể tải hồ sơ doanh nghiệp.'
        setFeedback({ type: 'error', message })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const calculateCompleteness = () => {
    let score = 0
    if (form.companyName.trim()) score += 20
    if (form.companyPhone.trim()) score += 15
    if (form.companyAddress.trim()) score += 15
    if (form.representativeName.trim()) score += 10
    if (form.representativePosition.trim()) score += 10
    if (form.companyWebsite.trim()) score += 10
    if (form.description.trim()) score += 10
    if (hasCustomLogo) score += 10
    return Math.min(100, score)
  }

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn file logo có định dạng JPG, PNG, WEBP hoặc SVG.' })
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Kích thước logo không được vượt quá 5MB.' })
      e.target.value = ''
      return
    }

    setUploadingLogo(true)
    setFeedback(null)

    try {
      const res = await uploadEmployerLogoApi(file)
      if (res.data) {
        setProfileData(res.data)
        setForm((prev) => ({ ...prev, logo: res.data.logo || '' }))
      }
      setHasCustomLogo(true)
      setLogoTimestamp(Date.now())
      setFeedback({ type: 'success', message: 'Cập nhật logo doanh nghiệp thành công!' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Không thể tải logo lên.'
      setFeedback({ type: 'error', message })
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const handleDeleteLogo = async () => {
    if (!hasCustomLogo) return
    setUploadingLogo(true)
    setFeedback(null)

    try {
      const res = await deleteEmployerLogoApi()
      if (res.data) {
        setProfileData(res.data)
        setForm((prev) => ({ ...prev, logo: '' }))
      }
      setHasCustomLogo(false)
      setLogoTimestamp(Date.now())
      setFeedback({ type: 'success', message: 'Đã xóa logo doanh nghiệp.' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Không thể xóa logo.'
      setFeedback({ type: 'error', message })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      await updateEmployerProfileApi({
        companyName: form.companyName,
        companyPhone: form.companyPhone,
        companyAddress: form.companyAddress,
        companyWebsite: form.companyWebsite || null,
        companySize: form.companySize,
        description: form.description || null,
        representativeName: form.representativeName,
        representativePosition: form.representativePosition,
      })
      setFeedback({ type: 'success', message: 'Cập nhật thông tin doanh nghiệp thành công!' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.'
      setFeedback({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted fw-semibold">Đang tải hồ sơ doanh nghiệp...</p>
      </main>
    )
  }

  const completeness = calculateCompleteness()
  const logoUrl = getEmployerLogoUrl(user?.id, logoTimestamp)
  const initialLetter = (form.companyName || 'C').charAt(0).toUpperCase()
  const verificationStatus = profileData?.verificationStatus || 'PENDING_REVIEW'

  return (
    <main className="container employer-profile-page">
      <div className="employer-profile-heading">
        <div>
          <span className="eyebrow">Nhà tuyển dụng & Doanh nghiệp</span>
          <h1>Hồ sơ thông tin doanh nghiệp</h1>
          <p>Thông tin minh bạch và logo chuẩn nhận diện giúp xây dựng uy tín thương hiệu và thu hút nhiều ứng viên tiềm năng.</p>
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

      <div className="employer-profile-grid">
        <aside className="emp-card emp-sidebar">
          <div className="emp-logo-wrapper">
            <div className="emp-logo-frame">
              {uploadingLogo ? (
                <div className="spinner-border text-success" role="status" />
              ) : hasCustomLogo ? (
                <img
                  src={logoUrl}
                  crossOrigin="anonymous"
                  alt={`Logo của ${form.companyName || 'doanh nghiệp'}`}
                  onError={() => setHasCustomLogo(false)}
                />
              ) : (
                <span className="emp-initials">{initialLetter}</span>
              )}
            </div>

            <label
              htmlFor={logoInputId}
              className="logo-upload-label"
              title="Tải lên hoặc đổi logo công ty"
            >
              <i className="bi bi-camera-fill" />
              <input
                id={logoInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                disabled={uploadingLogo}
              />
            </label>

            {hasCustomLogo && !uploadingLogo && (
              <button
                type="button"
                className="logo-delete-btn"
                title="Xóa logo"
                onClick={handleDeleteLogo}
              >
                <i className="bi bi-trash3-fill" />
              </button>
            )}
          </div>

          <h2 className="h5 fw-bold text-dark mb-1">{form.companyName || 'Chưa đặt tên doanh nghiệp'}</h2>
          <div className="mb-3">
            {verificationStatus === 'VERIFIED' ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                <i className="bi bi-patch-check-fill me-1" /> Doanh nghiệp đã xác thực
              </span>
            ) : verificationStatus === 'REJECTED' ? (
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill">
                <i className="bi bi-x-circle-fill me-1" /> Hồ sơ bị từ chối
              </span>
            ) : (
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill">
                <i className="bi bi-hourglass-split me-1" /> Đang chờ duyệt xác thực
              </span>
            )}
          </div>

          <div className="emp-completeness">
            <div className="completeness-header">
              <span>Độ hoàn thiện hồ sơ</span>
              <span className="pct">{completeness}%</span>
            </div>
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${completeness}%` }}
                aria-valuenow={completeness}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <div className="emp-trust-tip mb-3">
            <i className="bi bi-shield-check" />
            <div>
              <strong>Uy tín tuyển dụng:</strong>
              <div className="mt-1">
                {completeness < 75
                  ? 'Cập nhật logo sắc nét, số điện thoại và website để gia tăng 2.5x tỷ lệ ứng viên nộp CV.'
                  : 'Hồ sơ doanh nghiệp đạt chuẩn chuyên nghiệp, sẵn sàng tiếp cận ứng viên tiềm năng.'}
              </div>
            </div>
          </div>

          <div className="text-start border-top pt-3 small text-muted">
            <div className="mb-2 d-flex align-items-center gap-2">
              <i className="bi bi-upc-scan text-success" />
              <span>MST: <strong>{form.taxCode || '---'}</strong></span>
            </div>
            <div className="mb-2 d-flex align-items-center gap-2">
              <i className="bi bi-telephone text-success" />
              <span>{form.companyPhone || 'Chưa có SĐT'}</span>
            </div>
            {form.companyWebsite && (
              <div className="mb-2 d-flex align-items-center gap-2 text-truncate">
                <i className="bi bi-globe2 text-success" />
                <a href={form.companyWebsite} target="_blank" rel="noreferrer" className="text-decoration-none text-truncate">
                  {form.companyWebsite.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-people text-success" />
              <span>{form.companySize}</span>
            </div>
          </div>
        </aside>

        <section className="emp-card">
          <form onSubmit={handleSubmit}>
            <div className="emp-section">
              <h3 className="emp-section-title">
                <i className="bi bi-building-check" /> Thông tin pháp lý & Nhận diện
              </h3>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Tên doanh nghiệp <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập tên doanh nghiệp theo giấy phép kinh doanh"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Mã số thuế</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control bg-light text-muted rounded-start-3"
                      value={form.taxCode}
                      disabled
                    />
                    <span className="input-group-text bg-light text-muted border-start-0">
                      <i className="bi bi-lock-fill" title="Khóa pháp lý" />
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Số giấy phép kinh doanh</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control bg-light text-muted rounded-start-3"
                      value={form.businessLicenseNumber}
                      disabled
                    />
                    <span className="input-group-text bg-light text-muted border-start-0">
                      <i className="bi bi-lock-fill" title="Khóa pháp lý" />
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Người đại diện pháp luật <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập họ và tên người đại diện"
                    value={form.representativeName}
                    onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Chức vụ người đại diện <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập chức vụ (Giám đốc, Tổng giám đốc...)"
                    value={form.representativePosition}
                    onChange={(e) => setForm({ ...form, representativePosition: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="emp-section">
              <h3 className="emp-section-title">
                <i className="bi bi-geo-alt" /> Liên hệ & Quy mô hoạt động
              </h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Số điện thoại doanh nghiệp <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control rounded-3"
                    placeholder="Nhập số điện thoại liên hệ"
                    value={form.companyPhone}
                    onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Website công ty</label>
                  <input
                    type="url"
                    className="form-control rounded-3"
                    placeholder="https://company.vn"
                    value={form.companyWebsite}
                    onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Quy mô nhân sự</label>
                  <select
                    className="form-select rounded-3"
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
                  <label className="form-label fw-semibold">
                    Địa chỉ trụ sở chính <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Nhập địa chỉ trụ sở chính"
                    value={form.companyAddress}
                    onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="emp-section">
              <h3 className="emp-section-title">
                <i className="bi bi-card-text" /> Giới thiệu tổng quan về doanh nghiệp
              </h3>
              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold mb-0">Mô tả doanh nghiệp & Môi trường làm việc</label>
                    <small className="text-muted">{form.description.length}/3000 ký tự</small>
                  </div>
                  <textarea
                    className="form-control rounded-3"
                    rows={5}
                    maxLength={3000}
                    placeholder="Chia sẻ về lĩnh vực hoạt động, tầm nhìn, văn hóa công ty và chế độ đãi ngộ..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end align-items-center gap-3 pt-3">
              <button
                type="submit"
                className="btn btn-emp-save d-inline-flex align-items-center gap-2"
                disabled={saving || uploadingLogo}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Đang lưu hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle fs-5" />
                    <span>Lưu hồ sơ doanh nghiệp</span>
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
