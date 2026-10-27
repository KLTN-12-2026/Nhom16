import { useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface PasswordInputProps {
  registration: UseFormRegisterReturn
  autoComplete: 'current-password' | 'new-password'
  required?: boolean
}

export function PasswordInput({ registration, autoComplete, required = true }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return <span className="auth-password-field">
    <input type={visible ? 'text' : 'password'} {...registration} autoComplete={autoComplete} required={required} />
    <button
      type="button"
      className="auth-password-field__toggle"
      aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
    </button>
  </span>
}
