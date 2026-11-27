import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { getCandidateAvatarUrl } from '../../apis/candidate'
import { submitReportApi } from '../../apis/recruitment'
import { AppLogo } from '../app-logo'
import { ROLE, type Role } from '../../constants/role.constant'
import { ROUTE } from '../../constants/route.constant'
import { useAuth } from '../../provider/auth-provider'
import { NotificationBell } from '../notification-bell'

const menus: Partial<Record<Role, { label: string; to: string }[]>> = {
  [ROLE.CANDIDATE]: [
    { label: 'Tìm việc', to: ROUTE.CANDIDATE_JOBS },
    { label: 'Việc làm gợi ý', to: ROUTE.CANDIDATE_RECOMMENDATIONS },
    { label: 'Hồ sơ cá nhân', to: '/candidate/profile' },
    { label: 'CV của tôi', to: ROUTE.CANDIDATE_CVS },
    { label: 'AI so khớp', to: '/candidate/ai/job-match' },
    { label: 'Việc đã ứng tuyển', to: '/candidate/applications' },
    { label: 'Việc đã lưu', to: '/candidate/saved-jobs' },
  ],
  [ROLE.EMPLOYER]: [
    { label: 'Tin tuyển dụng', to: '/employer/jobs' },
    { label: 'AI phân tích JD', to: '/employer/ai/jd-analysis' },
    { label: 'Hồ sơ doanh nghiệp', to: '/employer/company' },
    { label: 'Hồ sơ ứng tuyển', to: '/employer/applications' },
    { label: 'Ứng viên phù hợp', to: '/employer/recommendations' },
    { label: 'Ứng viên đã lưu', to: '/employer/favorite-candidates' },
  ],
}

export function PortalHeader({ role }: { role: Extract<Role, 1 | 2> }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const accountRef = useRef<HTMLDivElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(Date.now())
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (
    typeof window !== 'undefined' && window.localStorage.getItem('topcv-theme') === 'dark' ? 'dark' : 'light'
  ))
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportType, setReportType] = useState<'JOB' | 'USER' | 'COMPANY' | 'OTHER'>('OTHER')
  const [reportEntityId, setReportEntityId] = useState('')
  const [reportContent, setReportContent] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportFeedback, setReportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isCandidate = role === ROLE.CANDIDATE
  const roleLabel = isCandidate ? 'Ứng viên' : 'Nhà tuyển dụng'
  const avatarUrl = isCandidate ? getCandidateAvatarUrl(user?.id, avatarVersion) : null

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('topcv-theme', theme)
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    const refreshAvatar = (event: Event) => {
      const detail = (event as CustomEvent<{ timestamp?: number }>).detail
      setAvatarFailed(false)
      setAvatarVersion(detail?.timestamp || Date.now())
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('candidate-avatar-updated', refreshAvatar)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('candidate-avatar-updated', refreshAvatar)
    }
  }, [])

  const handleLogout = async () => {
    setAccountOpen(false)
    await logout()
    navigate(ROUTE.HOME, { replace: true })
  }

  return (
    <header className="portal-header">
      <div className="container portal-header__inner">
        <NavLink className="portal-brand" to={role === ROLE.CANDIDATE ? ROUTE.CANDIDATE_HOME : ROUTE.EMPLOYER_HOME}>
          <AppLogo compact />
        </NavLink>
        <nav className="portal-nav" aria-label="Điều hướng tài khoản">
          {menus[role]?.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="portal-account">
          <NotificationBell />
          <div className="portal-account-menu" ref={accountRef}>
            <button
              type="button"
              className="portal-account__trigger"
              aria-label="Mở menu tài khoản"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <span className={`portal-account__avatar${avatarUrl && !avatarFailed ? ' has-image' : ''}`}>
                {avatarUrl && !avatarFailed
                  ? <img src={avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
                  : user?.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="portal-account__identity">
                <strong>{user?.fullName}</strong>
                <small>{roleLabel}</small>
              </span>
              <i className={`bi bi-chevron-down portal-account__chevron${accountOpen ? ' is-open' : ''}`} aria-hidden="true" />
            </button>
            {accountOpen && <div className="portal-account__dropdown">
              <div className="portal-account__summary">
                <strong>{user?.fullName}</strong>
                <span>{user?.email}</span>
              </div>
              <button
                type="button"
                className="portal-account__theme"
                onClick={toggleTheme}
              >
                <i className={`bi ${theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`} />
                <span>
                  <strong>Giao diện: {theme === 'dark' ? 'Tối' : 'Sáng'}</strong>
                  <small>{theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}</small>
                </span>
                <em className={`portal-theme-switch${theme === 'dark' ? ' is-dark' : ''}`} aria-hidden="true">
                  <b />
                </em>
              </button>
              <button
                type="button"
                className="portal-account__theme"
                onClick={() => {
                  setAccountOpen(false)
                  setReportFeedback(null)
                  setReportModalOpen(true)
                }}
              >
                <i className="bi bi-flag-fill" />
                <span>
                  <strong>Báo cáo & Phản hồi</strong>
                  <small>Gửi báo cáo vi phạm hoặc góp ý hệ thống</small>
                </span>
              </button>
              <button type="button" className="portal-account__logout" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" />
                <span>Đăng xuất</span>
              </button>
            </div>}
          </div>
        </div>
      </div>

      {reportModalOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Gửi báo cáo vi phạm hoặc phản hồi">
          <form
            className="admin-modal"
            onSubmit={async (event) => {
              event.preventDefault()
              if (reportContent.trim().length < 10) {
                setReportFeedback({ type: 'error', message: 'Nội dung báo cáo phải có ít nhất 10 ký tự.' })
                return
              }
              const parsedEntityId = reportEntityId.trim() ? Number(reportEntityId.trim()) : null
              if (parsedEntityId !== null && (!Number.isInteger(parsedEntityId) || parsedEntityId <= 0)) {
                setReportFeedback({ type: 'error', message: 'Mã đối tượng liên quan phải là số nguyên dương.' })
                return
              }
              setReportSubmitting(true)
              setReportFeedback(null)
              try {
                await submitReportApi({
                  reportType,
                  content: reportContent.trim(),
                  entityType: parsedEntityId ? reportType : null,
                  entityId: parsedEntityId,
                })
                setReportContent('')
                setReportEntityId('')
                setReportFeedback({
                  type: 'success',
                  message: 'Đã gửi báo cáo thành công! Quản trị viên sẽ xử lý và gửi thông báo kết quả cho bạn.',
                })
              } catch (cause) {
                setReportFeedback({
                  type: 'error',
                  message: cause instanceof Error ? cause.message : 'Không thể gửi báo cáo. Vui lòng thử lại.',
                })
              } finally {
                setReportSubmitting(false)
              }
            }}
          >
            <button className="admin-modal__close" type="button" aria-label="Đóng" onClick={() => setReportModalOpen(false)}>×</button>
            <span className="eyebrow">Hỗ trợ & An toàn nền tảng</span>
            <h2>Báo cáo vi phạm & Gửi phản hồi</h2>
            <p className="text-muted small">Thông tin người báo cáo được bảo mật tuyệt đối. Bạn sẽ nhận được thông báo ngay khi Quản trị viên xử lý.</p>

            {reportFeedback && (
              <div className={`alert ${reportFeedback.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 px-3 small mb-0`}>
                {reportFeedback.message}
              </div>
            )}

            <label>
              Loại báo cáo / phản hồi
              <select value={reportType} onChange={(e) => setReportType(e.target.value as 'JOB' | 'USER' | 'COMPANY' | 'OTHER')}>
                <option value="JOB">Tin tuyển dụng vi phạm (JOB)</option>
                <option value="COMPANY">Doanh nghiệp đáng ngờ (COMPANY)</option>
                <option value="USER">Tài khoản người dùng vi phạm (USER)</option>
                <option value="OTHER">Phản hồi / Góp ý hệ thống (OTHER)</option>
              </select>
            </label>

            {reportType !== 'OTHER' && (
              <label>
                Mã đối tượng liên quan (không bắt buộc)
                <input
                  type="number"
                  min={1}
                  value={reportEntityId}
                  onChange={(e) => setReportEntityId(e.target.value)}
                  placeholder={`Nhập ID ${reportType === 'JOB' ? 'tin tuyển dụng' : reportType === 'COMPANY' ? 'doanh nghiệp' : 'người dùng'} (nếu có)`}
                />
              </label>
            )}

            <label>
              Nội dung chi tiết *
              <textarea
                required
                minLength={10}
                maxLength={5000}
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Mô tả rõ vấn đề hoặc hành vi vi phạm bạn gặp phải (tối thiểu 10 ký tự)..."
              />
            </label>

            <div>
              <button type="button" onClick={() => setReportModalOpen(false)}>Đóng</button>
              <button type="submit" disabled={reportSubmitting}>
                {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
