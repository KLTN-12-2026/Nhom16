import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROLE } from '../../../constants/role.constant'
import { ROUTE } from '../../../constants/route.constant'
import type { GoogleCompletePayload } from '../../../model/auth.model'
import { authActions } from '../../../modules/auth/redux'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { AuthShell } from '../components/auth-shell'

type FormState = Omit<GoogleCompletePayload, 'challengeId'>

const initialForm: FormState = {
  code: '', role: ROLE.CANDIDATE, termsAccepted: false,
  companyName: '', taxCode: '', businessLicenseNumber: '', companyPhone: '', companyAddress: '', companyWebsite: '',
  representativeName: '', representativePosition: '',
}

export default function GoogleCompletePage() {
  const [form, setForm] = useState(initialForm)
  const [resendCountdown, setResendCountdown] = useState(15)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { error, googleChallenge, message, submitting, user } = useAppSelector((state) => state.auth)
  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }))
  const isNew = Boolean(googleChallenge?.requiresProfile)
  const canSubmit = Boolean(googleChallenge && /^\d{6}$/.test(form.code) && (!isNew || form.termsAccepted) && !submitting)

  useEffect(() => { dispatch(authActions.feedbackCleared()) }, [dispatch])
  useEffect(() => { if (user) navigate(ROUTE.HOME, { replace: true }) }, [navigate, user])
  useEffect(() => {
    if (resendCountdown <= 0) return undefined
    const timer = window.setInterval(() => setResendCountdown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendCountdown])

  const resendCode = () => {
    if (!googleChallenge || resendCountdown > 0 || submitting) return
    setResendCountdown(15)
    dispatch(authActions.googleResendRequested({ challengeId: googleChallenge.challengeId }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!googleChallenge || !canSubmit) return
    dispatch(authActions.googleCompleteRequested({
      ...form,
      challengeId: googleChallenge.challengeId,
      ...(isNew ? {} : {
        role: undefined,
        termsAccepted: undefined,
        companyName: undefined,
        taxCode: undefined,
        businessLicenseNumber: undefined,
        companyPhone: undefined,
        companyAddress: undefined,
        companyWebsite: undefined,
        representativeName: undefined,
        representativePosition: undefined,
      }),
    }))
  }

  if (!googleChallenge) return <AuthShell title="Phiên xác minh đã kết thúc" description="Vui lòng quay lại và chọn tài khoản Google một lần nữa.">
    <p className="auth-switch"><Link to={ROUTE.LOGIN}>Quay lại đăng nhập</Link></p>
  </AuthShell>

  return <AuthShell title="Xác minh đăng nhập Google" description={`Mã gồm 6 chữ số đã được gửi đến ${googleChallenge.email}.`}>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {message && <div className="auth-alert auth-alert--success" role="status">{message}</div>}
    <form className="auth-form" onSubmit={submit}>
      <label>Mã xác minh<input inputMode="numeric" maxLength={6} value={form.code} onChange={(event) => update('code', event.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" placeholder="000000" required /></label>
      <button className="auth-resend" type="button" onClick={resendCode} disabled={resendCountdown > 0 || submitting}>
        {resendCountdown > 0 ? `Gửi lại mã sau ${resendCountdown}s` : 'Gửi lại mã xác minh'}
      </button>
      {isNew && <>
        <div className="role-picker" role="radiogroup" aria-label="Loại tài khoản">
          <button type="button" className={form.role === ROLE.CANDIDATE ? 'active' : ''} onClick={() => update('role', ROLE.CANDIDATE)}><i className="bi bi-person" /><span><strong>Tôi đang tìm việc</strong><small>Tạo hồ sơ ứng viên</small></span></button>
          <button type="button" className={form.role === ROLE.EMPLOYER ? 'active' : ''} onClick={() => update('role', ROLE.EMPLOYER)}><i className="bi bi-building" /><span><strong>Tôi cần tuyển người</strong><small>Đăng ký doanh nghiệp</small></span></button>
        </div>
        {form.role === ROLE.EMPLOYER && <div className="auth-form__section">
          <h3>Thông tin xác minh doanh nghiệp</h3>
          <label>Tên doanh nghiệp<input value={form.companyName} onChange={(event) => update('companyName', event.target.value)} required /></label>
          <div className="auth-form__row"><label>Mã số thuế<input inputMode="numeric" value={form.taxCode} onChange={(event) => update('taxCode', event.target.value)} required /></label><label>Số giấy phép kinh doanh<input value={form.businessLicenseNumber} onChange={(event) => update('businessLicenseNumber', event.target.value)} required /></label></div>
          <div className="auth-form__row"><label>Điện thoại doanh nghiệp<input type="tel" value={form.companyPhone} onChange={(event) => update('companyPhone', event.target.value)} required /></label><label>Website<input type="url" value={form.companyWebsite || ''} onChange={(event) => update('companyWebsite', event.target.value)} placeholder="https://doanhnghiep.vn" /></label></div>
          <label>Địa chỉ trụ sở<input value={form.companyAddress} onChange={(event) => update('companyAddress', event.target.value)} required /></label>
          <div className="auth-form__row"><label>Người đại diện<input value={form.representativeName} onChange={(event) => update('representativeName', event.target.value)} required /></label><label>Chức vụ<input value={form.representativePosition} onChange={(event) => update('representativePosition', event.target.value)} required /></label></div>
          <p className="auth-config-note">Hồ sơ doanh nghiệp sẽ được quản trị viên kiểm tra trước khi mở đầy đủ tính năng tuyển dụng.</p>
        </div>}
        <label className="auth-consent"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => update('termsAccepted', event.target.checked)} /> Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label>
      </>}
      <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit}>{submitting ? 'Đang xác minh...' : 'Xác minh và tiếp tục'}</button>
    </form>
    <p className="auth-switch"><Link to={ROUTE.LOGIN} onClick={() => dispatch(authActions.googleChallengeCleared())}>Chọn tài khoản Google khác</Link></p>
  </AuthShell>
}
