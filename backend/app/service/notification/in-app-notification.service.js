const { db } = require('../../db')

const listNotifications = async (userId) => {
  const notifications = await db.Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 50,
  })
  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  }
}

const markNotificationRead = async (userId, id) => {
  const notification = await db.Notification.findOne({ where: { id, userId } })
  if (!notification) return null
  await notification.update({ readAt: notification.readAt || new Date() })
  return notification
}

const markAllNotificationsRead = async (userId) => {
  await db.Notification.update({ readAt: new Date() }, { where: { userId, readAt: null } })
  return listNotifications(userId)
}

module.exports = { listNotifications, markAllNotificationsRead, markNotificationRead }
