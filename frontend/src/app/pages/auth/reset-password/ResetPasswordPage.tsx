import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ROUTE } from '../../../constants/route.constant'
import { authActions } from '../../../modules/auth/redux'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { PasswordStrength } from '../components/password-strength'
import { AuthShell } from '../components/auth-shell'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { error, message, submitting } = useAppSelector((state) => state.auth)
  const token = searchParams.get('token') || ''
  const canSubmit = Boolean(token && password && password === confirmPassword && !submitting)

  useEffect(() => { dispatch(authActions.feedbackCleared()) }, [dispatch])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (canSubmit) dispatch(authActions.resetPasswordRequested({ token, password, confirmPassword }))
  }

  return <AuthShell title="Đặt lại mật khẩu" description="Tạo mật khẩu mới an toàn cho tài khoản của bạn.">
    {!token && <div className="auth-alert" role="alert">Liên kết đặt lại mật khẩu không hợp lệ.</div>}
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {message && <div className="auth-alert auth-alert--success" role="status">{message}</div>}
    <form className="auth-form" onSubmit={submit}>
      <label>Mật khẩu mới<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></label>
      <PasswordStrength password={password} />
      <label>Xác nhận mật khẩu<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></label>
      <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit}>{submitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</button>
    </form>
    <p className="auth-switch"><Link to={ROUTE.LOGIN}>Quay lại đăng nhập</Link></p>
  </AuthShell>
}
