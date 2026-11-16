const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { createReport } = require('../../service/admin/admin-management.service')
const { sendSuccess } = require('../../util')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { validateReportCreate } = require('../../validator/admin/admin-management.validator')

const initReportController = (app) => {
  const router = express.Router()
  router.use(authenticateJwt)
  router.post('/', validateBody(validateReportCreate), (req, res, next) =>
    createReport(req.validatedBody, req.user)
      .then((data) => sendSuccess(res, { statusCode: 201, data, message: 'Gửi báo cáo thành công.' }))
      .catch(next))
  app.use('/api/reports', router)
}

module.exports = { initReportController }
