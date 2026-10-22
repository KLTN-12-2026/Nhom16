const checks = [
  (password: string) => password.length >= 8,
  (password: string) => /[a-z]/.test(password),
  (password: string) => /[A-Z]/.test(password),
  (password: string) => /[0-9]/.test(password),
  (password: string) => /[^A-Za-z0-9]/.test(password),
]

const strengthMeta = [
  { label: 'Chưa nhập mật khẩu', tone: 'empty' },
  { label: 'Rất yếu', tone: 'weak' },
  { label: 'Yếu', tone: 'weak' },
  { label: 'Trung bình', tone: 'medium' },
  { label: 'Khá mạnh', tone: 'good' },
  { label: 'Mạnh', tone: 'strong' },
] as const

export function PasswordStrength({ password }: { password: string }) {
  const score = password ? checks.filter((check) => check(password)).length : 0
  const meta = strengthMeta[score]

  return (
    <div className={`password-strength password-strength--${meta.tone}`}>
      <div
        className="password-strength__bar"
        role="meter"
        aria-label="Độ mạnh mật khẩu"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={score}
        aria-valuetext={meta.label}
      >
        {checks.map((_, index) => <span className={index < score ? 'is-active' : ''} key={index} />)}
      </div>
      <div className="password-strength__caption">
        <span>{meta.label}</span>
        {score < 5 && password && <small>8+ ký tự · A–Z · a–z · 0–9 · ký tự đặc biệt</small>}
      </div>
    </div>
  )
}
