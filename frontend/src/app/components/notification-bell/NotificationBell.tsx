import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { listNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi, type NotificationData } from '../../apis/notification'
import { ROLE } from '../../constants/role.constant'
import { useAuth } from '../../provider/auth-provider'

const iconByType = (type: string) => {
  if (type === 'NEW_APPLICATION') return 'bi-person-plus'
  if (type === 'APPLICATION_INTERVIEW') return 'bi-camera-video'
  if (type === 'APPLICATION_OFFER') return 'bi-patch-check'
  if (type === 'APPLICATION_REJECTED') return 'bi-x-circle'
  if (type.startsWith('APPLICATION_')) return 'bi-file-earmark-check'
  if (type === 'EMPLOYER_PENDING_REVIEW') return 'bi-building-exclamation'
  if (type === 'EMPLOYER_APPROVED') return 'bi-building-check'
  if (type === 'EMPLOYER_REJECTED') return 'bi-building-x'
  return 'bi-bell'
}

const timeAgo = (value: string) => {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await listNotificationsApi()
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
      setError('')
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : 'Không thể tải thông báo.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    void load(true)
    const interval = window.setInterval(() => void load(true), 30000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [])

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications])

  const destination = (notification: NotificationData) => {
    if (notification.type === 'NEW_APPLICATION') return '/employer/applications'
    if (notification.type.startsWith('APPLICATION_')) return '/candidate/applications'
    if (notification.type === 'EMPLOYER_PENDING_REVIEW') return '/admin/employers'
    if (notification.type.startsWith('EMPLOYER_')) return '/employer/company'
    if (user?.role === ROLE.ADMIN) return '/admin/dashboard'
    return user?.role === ROLE.EMPLOYER ? '/employer' : '/candidate'
  }

  const openNotification = async (notification: NotificationData) => {
    if (!notification.readAt) {
      await markNotificationReadApi(notification.id).catch(() => undefined)
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    }
    setOpen(false)
    navigate(destination(notification))
  }

  const markAll = async () => {
    const response = await markAllNotificationsReadApi()
    setNotifications(response.data.notifications)
    setUnreadCount(0)
  }

  return <div className="notification-bell" ref={rootRef}>
    <button className="notification-bell__trigger" type="button" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void load() }}>
      <i className={`bi ${unreadCount ? 'bi-bell-fill' : 'bi-bell'}`} />
      {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <div className="notification-popover" role="dialog" aria-label="Thông báo">
      <div className="notification-popover__header"><div><strong>Thông báo</strong><span>{unreadCount ? `${unreadCount} chưa đọc` : 'Bạn đã đọc tất cả'}</span></div>{unreadCount > 0 && <button type="button" onClick={() => void markAll()}>Đánh dấu đã đọc</button>}</div>
      <div className="notification-popover__body">
        {loading && <div className="notification-popover__state"><span className="spinner-border spinner-border-sm text-success" /> Đang tải...</div>}
        {!loading && error && <div className="notification-popover__state is-error"><i className="bi bi-exclamation-circle" />{error}<button type="button" onClick={() => void load()}>Thử lại</button></div>}
        {!loading && !error && visibleNotifications.length === 0 && <div className="notification-popover__state"><i className="bi bi-bell-slash" /><strong>Chưa có thông báo</strong><span>Các cập nhật mới sẽ xuất hiện tại đây.</span></div>}
        {!loading && !error && visibleNotifications.map((notification) => <button className={`notification-item${notification.readAt ? '' : ' is-unread'}`} type="button" key={notification.id} onClick={() => void openNotification(notification)}><span className="notification-item__icon"><i className={`bi ${iconByType(notification.type)}`} /></span><span className="notification-item__content"><strong>{notification.title}</strong><span>{notification.message}</span><small>{timeAgo(notification.createdAt)}</small></span>{!notification.readAt && <i className="notification-item__dot" />}</button>)}
      </div>
    </div>}
  </div>
}
