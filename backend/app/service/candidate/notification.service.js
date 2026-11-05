const { db } = require('../../db')

const listNotifications = (userId) => db.Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 })
const markNotificationRead = async (userId, id) => {
  const notification = await db.Notification.findOne({ where: { id, userId } })
  if (!notification) return null
  await notification.update({ readAt: notification.readAt || new Date() })
  return notification
}

module.exports = { listNotifications, markNotificationRead }
