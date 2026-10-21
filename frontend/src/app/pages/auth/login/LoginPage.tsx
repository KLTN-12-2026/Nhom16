import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ApiClientError } from '../../../apis/fetch-api'
import { authApi } from '../../../apis/auth'
import { ROUTE } from '../../../constants/route.constant'
import { useAuth } from '../../../provider/auth-provider'
import { useRecaptcha } from '../../../provider/external-auth-provider'
import { AuthShell } from '../components/auth-shell'
import { GoogleAuthButton } from '../components/google-auth-button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const executeRecaptcha = useRecaptcha()
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const finishLogin = (user: Awaited<ReturnType<typeof authApi.login>>['data']['user']) => {
    setSession(user)
    const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || ROUTE.HOME
    navigate(destination, { replace: true })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true)
    try {
      const token = await executeRecaptcha('login')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng nhập.')
      const response = await authApi.login({ email, password, recaptchaToken: token })
      finishLogin(response.data.user)
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : (caught as Error).message)
    } finally { setSubmitting(false) }
  }

  const handleGoogle = async (credential: string) => {
    setError(''); setSubmitting(true)
    try {
      const token = await executeRecaptcha('google_login')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng nhập.')
      const response = await authApi.google({ credential, recaptchaToken: token })
      finishLogin(response.data.user)
    } catch (caught) { setError(caught instanceof ApiClientError ? caught.message : (caught as Error).message) }
    finally { setSubmitting(false) }
  }

  return <AuthShell title="Chào mừng bạn trở lại" description="Đăng nhập để tiếp tục công việc đang theo dõi.">
    <GoogleAuthButton onCredential={handleGoogle} /><div className="auth-divider"><span>hoặc dùng email</span></div>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      <div className="auth-form__options"><label><input type="checkbox" /> Ghi nhớ đăng nhập</label><a href="#forgot-password">Quên mật khẩu?</a></div>
      <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
    <p className="auth-switch">Chưa có tài khoản? <Link to={ROUTE.REGISTER}>Đăng ký ngay</Link></p>
  </AuthShell>
}
