import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { ROLE } from '../../../constants/role.constant'
import { ROUTE } from '../../../constants/route.constant'
import type { RegisterPayload } from '../../../model/auth.model'
import { authActions } from '../../../modules/auth/redux'
import { useRecaptcha } from '../../../provider/external-auth-provider'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { AuthShell } from '../components/auth-shell'
import { PasswordStrength } from '../components/password-strength'

const initialForm: Omit<RegisterPayload, 'recaptchaToken'> = {
  fullName: '', email: '', password: '', confirmPassword: '', role: ROLE.CANDIDATE, termsAccepted: false,
  companyName: '', taxCode: '', businessLicenseNumber: '', companyPhone: '', companyAddress: '', companyWebsite: '',
  representativeName: '', representativePosition: '',
}

export default function RegisterPage() {
  const { register, handleSubmit, setValue, watch } = useForm<typeof initialForm>({ defaultValues: initialForm })
  const role = watch('role')
  const termsAccepted = watch('termsAccepted')
  const password = watch('password')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { error, message: success, submitting, user } = useAppSelector((state) => state.auth)
  const executeRecaptcha = useRecaptcha()
  const canSubmit = termsAccepted && !submitting

  useEffect(() => { dispatch(authActions.feedbackCleared()) }, [dispatch])
  useEffect(() => { if (user) navigate(ROUTE.HOME, { replace: true }) }, [navigate, user])

  const submit = async (form: typeof initialForm) => {
    if (!canSubmit) return
    try {
      const token = await executeRecaptcha('register')
      if (!token) throw new Error('Vui lòng cấu hình reCAPTCHA trước khi đăng ký.')
      dispatch(authActions.registerRequested({ ...form, recaptchaToken: token }))
    } catch (caught) { dispatch(authActions.authFailed((caught as Error).message)) }
  }

  return <AuthShell title="Tạo tài khoản" description="Chọn mục đích sử dụng để bắt đầu với không gian phù hợp.">
    <div className="role-picker" role="radiogroup" aria-label="Loại tài khoản">
      <button type="button" className={role === ROLE.CANDIDATE ? 'active' : ''} onClick={() => setValue('role', ROLE.CANDIDATE)}><i className="bi bi-person" /><span><strong>Tôi đang tìm việc</strong><small>Tạo hồ sơ ứng viên</small></span></button>
      <button type="button" className={role === ROLE.EMPLOYER ? 'active' : ''} onClick={() => setValue('role', ROLE.EMPLOYER)}><i className="bi bi-building" /><span><strong>Tôi cần tuyển người</strong><small>Tạo tài khoản doanh nghiệp</small></span></button>
    </div>
    {error && <div className="auth-alert" role="alert">{error}</div>}{success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}
    <form className="auth-form" onSubmit={handleSubmit(submit)}>
      <label>Họ và tên<input {...register('fullName', { required: true })} autoComplete="name" required /></label>
      <label>Email<input type="email" {...register('email', { required: true })} autoComplete="email" required /></label>
      <div className="auth-form__row"><label>Mật khẩu<input type="password" {...register('password', { required: true })} autoComplete="new-password" required /><PasswordStrength password={password} /></label><label>Xác nhận mật khẩu<input type="password" {...register('confirmPassword', { required: true })} autoComplete="new-password" required /></label></div>
      {role === ROLE.EMPLOYER && <div className="auth-form__section">
        <h3>Thông tin xác minh doanh nghiệp</h3>
        <label>Tên doanh nghiệp<input {...register('companyName', { required: role === ROLE.EMPLOYER })} required /></label>
        <div className="auth-form__row"><label>Mã số thuế<input inputMode="numeric" {...register('taxCode', { required: role === ROLE.EMPLOYER })} required /></label><label>Số giấy phép kinh doanh<input {...register('businessLicenseNumber', { required: role === ROLE.EMPLOYER })} required /></label></div>
        <div className="auth-form__row"><label>Điện thoại doanh nghiệp<input type="tel" {...register('companyPhone', { required: role === ROLE.EMPLOYER })} required /></label><label>Website<input type="url" {...register('companyWebsite')} placeholder="https://doanhnghiep.vn" /></label></div>
        <label>Địa chỉ trụ sở<input {...register('companyAddress', { required: role === ROLE.EMPLOYER })} required /></label>
        <div className="auth-form__row"><label>Người đại diện<input {...register('representativeName', { required: role === ROLE.EMPLOYER })} required /></label><label>Chức vụ<input {...register('representativePosition', { required: role === ROLE.EMPLOYER })} required /></label></div>
        <p className="auth-config-note">Hồ sơ doanh nghiệp sẽ được kiểm tra trước khi sử dụng đầy đủ tính năng tuyển dụng.</p>
      </div>}
      <label className="auth-consent"><input type="checkbox" {...register('termsAccepted', { required: true })} /> Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label>
      <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit}>{submitting ? 'Đang tạo tài khoản...' : role === ROLE.EMPLOYER ? 'Gửi hồ sơ đăng ký' : 'Tạo tài khoản'}</button>
    </form>
    <p className="auth-switch">Đã có tài khoản? <Link to={ROUTE.LOGIN}>Đăng nhập</Link></p>
  </AuthShell>
}
