import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ROUTE } from '../../../constants/route.constant'
import { authActions } from '../../../modules/auth/redux'
import { useRecaptcha } from '../../../provider/external-auth-provider'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { AuthShell } from '../components/auth-shell'
import { GoogleAuthButton } from '../components/google-auth-button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useAppDispatch()
  const { error, submitting, user } = useAppSelector((state) => state.auth)
  const executeRecaptcha = useRecaptcha()
  const navigate = useNavigate()
  const location = useLocation()
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  useEffect(() => {
    dispatch(authActions.feedbackCleared())
  }, [dispatch])

  useEffect(() => {
    if (!user) return
    const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || ROUTE.HOME
    navigate(destination, { replace: true })
  }, [location.state, navigate, user])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    try {
      const token = await executeRecaptcha('login')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng nhập.')
      dispatch(authActions.loginRequested({ email, password, recaptchaToken: token }))
    } catch (caught) {
      dispatch(authActions.authFailed((caught as Error).message))
    }
  }

  const handleGoogle = async (credential: string) => {
    try {
      const token = await executeRecaptcha('google_login')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng nhập.')
      dispatch(authActions.googleRequested({ credential, recaptchaToken: token }))
    } catch (caught) { dispatch(authActions.authFailed((caught as Error).message)) }
  }

  return <AuthShell title="Chào mừng bạn trở lại" description="Đăng nhập để tiếp tục công việc đang theo dõi.">
    <GoogleAuthButton onCredential={handleGoogle} /><div className="auth-divider"><span>hoặc dùng email</span></div>
    {error && <div className="auth-alert" role="alert">{error}</div>}
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      <div className="auth-form__options"><label><input type="checkbox" /> Ghi nhớ đăng nhập</label><a href="#forgot-password">Quên mật khẩu?</a></div>
      <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit}>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
    <p className="auth-switch">Chưa có tài khoản? <Link to={ROUTE.REGISTER}>Đăng ký ngay</Link></p>
  </AuthShell>
}
