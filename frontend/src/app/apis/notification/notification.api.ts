import { fetchApi } from '../fetch-api'

export interface NotificationData {
  id: number
  type: string
  title: string
  message: string
  entityType: string | null
  entityId: number | null
  readAt: string | null
  createdAt: string
}

export interface NotificationListData {
  notifications: NotificationData[]
  unreadCount: number
}

export const listNotificationsApi = () => fetchApi<NotificationListData>('/notifications')
export const markNotificationReadApi = (id: number) => fetchApi<NotificationData>(`/notifications/${id}/read`, { method: 'PATCH' })
export const markAllNotificationsReadApi = () => fetchApi<NotificationListData>('/notifications/read-all', { method: 'PATCH' })
