import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROLE } from '../../../constants/role.constant'
import { ROUTE } from '../../../constants/route.constant'
import type { RegisterPayload } from '../../../model/auth.model'
import { authActions } from '../../../modules/auth/redux'
import { useRecaptcha } from '../../../provider/external-auth-provider'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { AuthShell } from '../components/auth-shell'
import { GoogleAuthButton } from '../components/google-auth-button'
import { PasswordStrength } from '../components/password-strength'

const initialForm: Omit<RegisterPayload, 'recaptchaToken'> = {
  fullName: '', email: '', password: '', confirmPassword: '', role: ROLE.CANDIDATE, termsAccepted: false,
  companyName: '', taxCode: '', businessLicenseNumber: '', companyPhone: '', companyAddress: '', companyWebsite: '',
  representativeName: '', representativePosition: '',
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { error, message: success, submitting, user } = useAppSelector((state) => state.auth)
  const executeRecaptcha = useRecaptcha()
  const update = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [field]: value }))

  useEffect(() => { dispatch(authActions.feedbackCleared()) }, [dispatch])
  useEffect(() => { if (user) navigate(ROUTE.HOME, { replace: true }) }, [navigate, user])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const token = await executeRecaptcha('register')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng ký.')
      dispatch(authActions.registerRequested({ ...form, recaptchaToken: token }))
    } catch (caught) { dispatch(authActions.authFailed((caught as Error).message)) }
  }

  const handleGoogle = async (credential: string) => {
    try {
      const token = await executeRecaptcha('google_register')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng ký.')
      dispatch(authActions.googleRequested({ credential, role: form.role, termsAccepted: form.termsAccepted, recaptchaToken: token }))
    } catch (caught) { dispatch(authActions.authFailed((caught as Error).message)) }
  }

  return <AuthShell title="Tạo tài khoản" description="Chọn mục đích sử dụng để bắt đầu với không gian phù hợp.">
    <div className="role-picker" role="radiogroup" aria-label="Loại tài khoản">
      <button type="button" className={form.role === ROLE.CANDIDATE ? 'active' : ''} onClick={() => update('role', ROLE.CANDIDATE)}><i className="bi bi-person" /><span><strong>Tôi đang tìm việc</strong><small>Tạo hồ sơ ứng viên</small></span></button>
      <button type="button" className={form.role === ROLE.EMPLOYER ? 'active' : ''} onClick={() => update('role', ROLE.EMPLOYER)}><i className="bi bi-building" /><span><strong>Tôi cần tuyển người</strong><small>Tạo tài khoản doanh nghiệp</small></span></button>
    </div>
    {error && <div className="auth-alert" role="alert">{error}</div>}{success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Họ và tên<input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} autoComplete="name" required /></label>
      <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required /></label>
      <div className="auth-form__row"><label>Mật khẩu<input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" required /><PasswordStrength password={form.password} /></label><label>Xác nhận mật khẩu<input type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} autoComplete="new-password" required /></label></div>
      {form.role === ROLE.EMPLOYER && <div className="auth-form__section">
        <h3>Thông tin xác minh doanh nghiệp</h3>
        <label>Tên doanh nghiệp<input value={form.companyName} onChange={(event) => update('companyName', event.target.value)} required /></label>
        <div className="auth-form__row"><label>Mã số thuế<input inputMode="numeric" value={form.taxCode} onChange={(event) => update('taxCode', event.target.value)} required /></label><label>Số giấy phép kinh doanh<input value={form.businessLicenseNumber} onChange={(event) => update('businessLicenseNumber', event.target.value)} required /></label></div>
        <div className="auth-form__row"><label>Điện thoại doanh nghiệp<input type="tel" value={form.companyPhone} onChange={(event) => update('companyPhone', event.target.value)} required /></label><label>Website<input type="url" value={form.companyWebsite} onChange={(event) => update('companyWebsite', event.target.value)} placeholder="https://doanhnghiep.vn" /></label></div>
        <label>Địa chỉ trụ sở<input value={form.companyAddress} onChange={(event) => update('companyAddress', event.target.value)} required /></label>
        <div className="auth-form__row"><label>Người đại diện<input value={form.representativeName} onChange={(event) => update('representativeName', event.target.value)} required /></label><label>Chức vụ<input value={form.representativePosition} onChange={(event) => update('representativePosition', event.target.value)} required /></label></div>
        <p className="auth-config-note">Hồ sơ doanh nghiệp sẽ được kiểm tra trước khi sử dụng đầy đủ tính năng tuyển dụng.</p>
      </div>}
      <label className="auth-consent"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => update('termsAccepted', event.target.checked)} /> Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label>
      {form.termsAccepted && <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Đang tạo tài khoản...' : form.role === ROLE.EMPLOYER ? 'Gửi hồ sơ đăng ký' : 'Tạo tài khoản'}</button>}
    </form>
    {form.role === ROLE.CANDIDATE && form.termsAccepted && <><div className="auth-divider"><span>hoặc đăng ký nhanh</span></div><GoogleAuthButton onCredential={handleGoogle} /></>}
    <p className="auth-switch">Đã có tài khoản? <Link to={ROUTE.LOGIN}>Đăng nhập</Link></p>
  </AuthShell>
}
