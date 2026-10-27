import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { ROUTE } from '../../../constants/route.constant'
import { authActions } from '../../../modules/auth/redux'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { AuthShell } from '../components/auth-shell'

export default function VerifyEmailPage() {
  const { register, handleSubmit, watch } = useForm<{ email: string }>({ defaultValues: { email: '' } })
  const [searchParams] = useSearchParams()
  const started = useRef(false)
  const dispatch = useAppDispatch()
  const { error, message, submitting } = useAppSelector((state) => state.auth)
  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (started.current) return
    started.current = true
    dispatch(authActions.feedbackCleared())
    if (token) dispatch(authActions.verifyEmailRequested({ token }))
  }, [dispatch, token])

  const resend = ({ email }: { email: string }) => {
    if (email.trim() && !submitting) dispatch(authActions.resendVerificationRequested({ email }))
  }

  return <AuthShell title="Xác minh email" description="Hoàn tất xác minh để bảo vệ và kích hoạt tài khoản của bạn.">
    {submitting && token && <div className="auth-config-note" role="status">Đang xác minh tài khoản...</div>}
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {message && <div className="auth-alert auth-alert--success" role="status">{message}</div>}
    {!token && <div className="auth-alert" role="alert">Liên kết xác minh không có token hoặc không hợp lệ.</div>}
    {token && message
      ? <p className="auth-switch"><Link to={ROUTE.LOGIN}>Đi đến đăng nhập</Link></p>
      : <form className="auth-form" onSubmit={handleSubmit(resend)}>
          <label>Gửi lại email xác minh<input type="email" {...register('email', { required: true })} autoComplete="email" placeholder="email@example.com" required /></label>
          <button className="btn btn-primary auth-submit" type="submit" disabled={!watch('email')?.trim() || submitting}>{submitting ? 'Đang gửi...' : 'Gửi lại email'}</button>
        </form>}
  </AuthShell>
}
