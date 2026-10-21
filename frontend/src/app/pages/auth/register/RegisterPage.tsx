import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { authApi } from '../../../apis/auth'
import { ApiClientError } from '../../../apis/fetch-api'
import { ROLE } from '../../../constants/role.constant'
import { ROUTE } from '../../../constants/route.constant'
import type { RegisterPayload } from '../../../model/auth.model'
import { useRecaptcha } from '../../../provider/external-auth-provider'
import { AuthShell } from '../components/auth-shell'
import { GoogleAuthButton } from '../components/google-auth-button'

const initialForm: Omit<RegisterPayload, 'recaptchaToken'> = { fullName: '', email: '', password: '', confirmPassword: '', role: ROLE.CANDIDATE }

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const executeRecaptcha = useRecaptcha()
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSuccess(''); setSubmitting(true)
    try {
      const token = await executeRecaptcha('register')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng ký.')
      const response = await authApi.register({ ...form, recaptchaToken: token })
      setSuccess(response.message || 'Đăng ký thành công. Vui lòng kiểm tra email của bạn.')
    } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : (caught as Error).message) }
    finally { setSubmitting(false) }
  }

  const handleGoogle = async (credential: string) => {
    setError(''); setSubmitting(true)
    try {
      const token = await executeRecaptcha('google_register')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng ký.')
      await authApi.google({ credential, role: form.role, recaptchaToken: token })
      setSuccess('Tài khoản Google đã được kết nối thành công.')
    } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : (caught as Error).message) }
    finally { setSubmitting(false) }
  }

  return <AuthShell title="Tạo tài khoản" description="Chọn mục đích sử dụng để bắt đầu với không gian phù hợp.">
    <div className="role-picker" role="radiogroup" aria-label="Loại tài khoản">
      <button type="button" className={form.role === ROLE.CANDIDATE ? 'active' : ''} onClick={() => update('role', ROLE.CANDIDATE)}><i className="bi bi-person" /><span><strong>Tôi đang tìm việc</strong><small>Tạo hồ sơ ứng viên</small></span></button>
      <button type="button" className={form.role === ROLE.EMPLOYER ? 'active' : ''} onClick={() => update('role', ROLE.EMPLOYER)}><i className="bi bi-building" /><span><strong>Tôi cần tuyển người</strong><small>Tạo tài khoản doanh nghiệp</small></span></button>
    </div>
    <GoogleAuthButton onCredential={handleGoogle} /><div className="auth-divider"><span>hoặc đăng ký bằng email</span></div>
    {error && <div className="auth-alert" role="alert">{error}</div>}{success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Họ và tên<input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} autoComplete="name" required /></label>
      <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required /></label>
      <div className="auth-form__row"><label>Mật khẩu<input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" required /></label><label>Xác nhận mật khẩu<input type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} autoComplete="new-password" required /></label></div>
      <label className="auth-consent"><input type="checkbox" required /> Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label>
      <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</button>
    </form>
    <p className="auth-switch">Đã có tài khoản? <Link to={ROUTE.LOGIN}>Đăng nhập</Link></p>
  </AuthShell>
}
