const express = require('express')

const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { listNotifications, markAllNotificationsRead, markNotificationRead } = require('../../service/notification')
const { sendSuccess } = require('../../util')

const initNotificationController = (app) => {
  const router = express.Router()

  router.use(authenticateJwt)
  router.get('/', (req, res, next) => listNotifications(req.user.id)
    .then((data) => sendSuccess(res, { data, message: 'Lấy thông báo thành công.' }))
    .catch(next))
  router.patch('/read-all', (req, res, next) => markAllNotificationsRead(req.user.id)
    .then((data) => sendSuccess(res, { data, message: 'Đã đọc tất cả thông báo.' }))
    .catch(next))
  router.patch('/:id/read', (req, res, next) => markNotificationRead(req.user.id, req.params.id)
    .then((data) => sendSuccess(res, { data, message: 'Đã đọc thông báo.' }))
    .catch(next))

  app.use('/api/notifications', router)
}

module.exports = { initNotificationController }
