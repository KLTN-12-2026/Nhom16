import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { getPendingEmployersApi, reviewEmployerApi, type PendingEmployer } from '../../apis/admin/employer-review.api'
import { ApiClientError } from '../../apis/fetch-api'

export default function EmployerReviewPage() {
  const [profiles, setProfiles] = useState<PendingEmployer[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const { register, getValues, resetField } = useForm<Record<string, string>>()

  useEffect(() => {
    getPendingEmployersApi()
      .then((response) => setProfiles(response.data.profiles))
      .catch((cause) => setError(cause instanceof ApiClientError ? cause.message : 'Không thể tải hồ sơ doanh nghiệp.'))
  }, [])

  const review = async (profile: PendingEmployer, decision: 'APPROVE' | 'REJECT') => {
    const reason = getValues(`reason-${profile.id}`)?.trim() || ''
    if (decision === 'REJECT' && !reason) {
      setError('Vui lòng nhập lý do từ chối trước khi gửi.')
      return
    }
    setBusyId(profile.id)
    setError('')
    setMessage('')
    try {
      await reviewEmployerApi(profile.id, decision, reason)
      setProfiles((current) => current.filter((item) => item.id !== profile.id))
      resetField(`reason-${profile.id}`)
      setMessage(`Đã ${decision === 'APPROVE' ? 'chấp thuận' : 'từ chối'} ${profile.companyName}. Email kết quả đã được đưa vào hàng đợi gửi.`)
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Không thể xét duyệt hồ sơ.')
    } finally {
      setBusyId(null)
    }
  }

  return <section className="admin-page">
    <span className="eyebrow">Quản trị doanh nghiệp</span>
    <h1>Hồ sơ chờ xét duyệt</h1>
    <p>Kiểm tra thông tin trước khi chấp thuận. Kết quả sẽ được gửi tới email đăng ký.</p>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {message && <div className="auth-alert auth-alert--success" role="status">{message}</div>}
    {profiles.length === 0 && !error && <p>Hiện không có hồ sơ nào đang chờ xét duyệt.</p>}
    <div className="admin-review-list">
      {profiles.map((profile) => <article className="admin-review-card" key={profile.id}>
        <h2>{profile.companyName}</h2>
        <p><strong>Email:</strong> {profile.email} {profile.emailVerified ? '· Đã xác minh' : '· Chưa xác minh'}</p>
        <p><strong>Chủ tài khoản:</strong> {profile.accountName}</p>
        <p><strong>Mã số thuế:</strong> {profile.taxCode} · <strong>Giấy phép:</strong> {profile.businessLicenseNumber}</p>
        <p><strong>Điện thoại:</strong> {profile.companyPhone} · <strong>Địa chỉ:</strong> {profile.companyAddress}</p>
        <p><strong>Người đại diện:</strong> {profile.representativeName} ({profile.representativePosition})</p>
        {profile.companyWebsite && <p><strong>Website:</strong> <a href={profile.companyWebsite} target="_blank" rel="noreferrer">{profile.companyWebsite}</a></p>}
        <label>Lý do nếu từ chối<textarea {...register(`reason-${profile.id}`)} rows={2} maxLength={1000} /></label>
        <div className="admin-review-actions">
          <button type="button" className="btn btn-primary" disabled={busyId !== null} onClick={() => review(profile, 'APPROVE')}>Chấp thuận</button>
          <button type="button" className="btn btn-outline-danger" disabled={busyId !== null} onClick={() => review(profile, 'REJECT')}>Từ chối</button>
        </div>
      </article>)}
    </div>
  </section>
}
