import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { ROUTE } from '../../../constants/route.constant'
import { authActions } from '../../../modules/auth/redux'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { AuthShell } from '../components/auth-shell'

export default function ForgotPasswordPage() {
  const { register, handleSubmit, watch } = useForm<{ email: string }>({ defaultValues: { email: '' } })
  const dispatch = useAppDispatch()
  const { error, message, submitting } = useAppSelector((state) => state.auth)

  useEffect(() => { dispatch(authActions.feedbackCleared()) }, [dispatch])

  const submit = ({ email }: { email: string }) => {
    if (email.trim() && !submitting) dispatch(authActions.forgotPasswordRequested({ email }))
  }

  return <AuthShell title="Quên mật khẩu" description="Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.">
    {error && <div className="auth-alert" role="alert">{error}</div>}
    {message && <div className="auth-alert auth-alert--success" role="status">{message}</div>}
    <form className="auth-form" onSubmit={handleSubmit(submit)}>
      <label>Email<input type="email" {...register('email', { required: true })} autoComplete="email" required /></label>
      <button className="btn btn-primary auth-submit" type="submit" disabled={!watch('email')?.trim() || submitting}>{submitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}</button>
    </form>
    <p className="auth-switch"><Link to={ROUTE.LOGIN}>Quay lại đăng nhập</Link></p>
  </AuthShell>
}
