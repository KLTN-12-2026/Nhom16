const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { sendSuccess, ApiError } = require('../../util')
const { getAdminUsers, updateAdminUserStatus, updateAdminUserRole, getAdminDashboardMetrics } = require('../../service/admin/admin-user.service')
const { validateUpdateUserStatus, validateUpdateUserRole } = require('../../validator/admin/admin-user.validator')

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 3) {
    return next(new ApiError(403, 'Chỉ Quản trị viên mới có quyền thực hiện hành động này.', 'FORBIDDEN'))
  }
  next()
}

const initAdminController = (app) => {
  const router = express.Router()

  router.use(authenticateJwt)
  router.use(requireAdmin)

  router.get('/metrics', async (req, res, next) => {
    try {
      const data = await getAdminDashboardMetrics()
      sendSuccess(res, { data, message: 'Lấy số liệu tổng quan thành công.' })
    } catch (err) { next(err) }
  })

  router.get('/users', async (req, res, next) => {
    try {
      const data = await getAdminUsers(req.query)
      sendSuccess(res, { data, message: 'Lấy danh sách tài khoản thành công.' })
    } catch (err) { next(err) }
  })

  router.put('/users/:id/status', validateBody(validateUpdateUserStatus), async (req, res, next) => {
    try {
      const data = await updateAdminUserStatus(req.params.id, req.validatedBody, req.user)
      sendSuccess(res, { data, message: 'Cập nhật trạng thái tài khoản thành công.' })
    } catch (err) { next(err) }
  })

  router.put('/users/:id/role', validateBody(validateUpdateUserRole), async (req, res, next) => {
    try {
      const data = await updateAdminUserRole(req.params.id, req.validatedBody, req.user)
      sendSuccess(res, { data, message: 'Cập nhật vai trò người dùng thành công.' })
    } catch (err) { next(err) }
  })

  app.use('/api/admin', router)
}

module.exports = { initAdminController }
