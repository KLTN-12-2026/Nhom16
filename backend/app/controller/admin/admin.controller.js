const express = require('express')
const { PERMISSIONS } = require('../../constants/access-control.constant')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { requirePermission } = require('../../middleware/auth/require-permission.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { sendSuccess } = require('../../util')
const { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } = require('../../service/admin/admin-user.service')
const { createCatalog, getDashboard, listAuditLogs, listCatalogs, listJobs, listReports, moderateJob, resolveReport, toggleCatalog } = require('../../service/admin/admin-management.service')
const { validateUpdateUserStatus, validateUpdateUserRole } = require('../../validator/admin/admin-user.validator')
const { validateCatalogCreate, validateCatalogToggle, validateJobModeration, validateReportResolve } = require('../../validator/admin/admin-management.validator')

const initAdminController = (app) => {
  const router = express.Router()

  router.use(authenticateJwt)

  router.get('/metrics', requirePermission(PERMISSIONS.ADMIN_STATISTICS_VIEW), (req, res, next) =>
    getDashboard(req.query).then((data) => sendSuccess(res, { data, message: 'Lấy số liệu tổng quan thành công.' })).catch(next))

  router.get('/users', requirePermission(PERMISSIONS.ADMIN_USER_MANAGE), (req, res, next) =>
    getAdminUsers(req.query).then((data) => sendSuccess(res, { data, message: 'Lấy danh sách tài khoản thành công.' })).catch(next))

  router.put('/users/:id/status', requirePermission(PERMISSIONS.ADMIN_USER_MANAGE), validateBody(validateUpdateUserStatus), (req, res, next) =>
    updateAdminUserStatus(req.params.id, req.validatedBody, req.user)
      .then((data) => sendSuccess(res, { data, message: 'Cập nhật trạng thái tài khoản thành công.' })).catch(next))

  router.put('/users/:id/role', requirePermission(PERMISSIONS.ADMIN_USER_MANAGE), validateBody(validateUpdateUserRole), (req, res, next) =>
    updateAdminUserRole(req.params.id, req.validatedBody, req.user)
      .then((data) => sendSuccess(res, { data, message: 'Cập nhật vai trò người dùng thành công.' })).catch(next))

  router.get('/jobs', requirePermission(PERMISSIONS.ADMIN_JOB_MANAGE), (req, res, next) =>
    listJobs(req.query).then((data) => sendSuccess(res, { data })).catch(next))

  router.patch('/jobs/:id/moderation', requirePermission(PERMISSIONS.ADMIN_JOB_MANAGE), validateBody(validateJobModeration), (req, res, next) =>
    moderateJob(req.params.id, req.validatedBody, req.user).then((data) => sendSuccess(res, { data, message: 'Cập nhật tin tuyển dụng thành công.' })).catch(next))

  router.get('/audit-logs', requirePermission(PERMISSIONS.ADMIN_STATISTICS_VIEW), (req, res, next) =>
    listAuditLogs(req.query).then((data) => sendSuccess(res, { data })).catch(next))

  router.get('/catalogs', requirePermission(PERMISSIONS.ADMIN_CATEGORY_MANAGE), (req, res, next) =>
    listCatalogs().then((data) => sendSuccess(res, { data })).catch(next))

  router.post('/catalogs', requirePermission(PERMISSIONS.ADMIN_CATEGORY_MANAGE), validateBody(validateCatalogCreate), (req, res, next) =>
    createCatalog(req.validatedBody, req.user).then((data) => sendSuccess(res, { statusCode: 201, data, message: 'Tạo danh mục thành công.' })).catch(next))

  router.patch('/catalogs/:type/:id', requirePermission(PERMISSIONS.ADMIN_CATEGORY_MANAGE), validateBody(validateCatalogToggle), (req, res, next) =>
    toggleCatalog(req.params.type, req.params.id, req.validatedBody, req.user).then((data) => sendSuccess(res, { data, message: 'Cập nhật danh mục thành công.' })).catch(next))

  router.get('/reports', requirePermission(PERMISSIONS.ADMIN_REPORT_MANAGE), (req, res, next) =>
    listReports(req.query).then((data) => sendSuccess(res, { data })).catch(next))

  router.patch('/reports/:id', requirePermission(PERMISSIONS.ADMIN_REPORT_MANAGE), validateBody(validateReportResolve), (req, res, next) =>
    resolveReport(req.params.id, req.validatedBody, req.user).then((data) => sendSuccess(res, { data, message: 'Cập nhật báo cáo thành công.' })).catch(next))

  app.use('/api/admin', router)
}

module.exports = { initAdminController }
