const express = require('express')

const { authenticateAdmin } = require('../../middleware/auth/require-admin.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { createEmployerReviewService } = require('../../service/admin')
const { sendSuccess } = require('../../util')
const { validateEmployerReview } = require('../../validator/admin/employer-review.validator')

const initEmployerReviewController = (app, dependencies) => {
  const router = express.Router()
  const service = createEmployerReviewService({
    database: dependencies.database,
    models: dependencies.models,
    emailQueue: dependencies.emailQueue,
  })

  router.get('/employers/pending', authenticateAdmin, (req, res, next) => service.listPending()
    .then((profiles) => sendSuccess(res, { data: { profiles } }))
    .catch(next))

  router.post('/employers/:id/review', authenticateAdmin, validateBody(validateEmployerReview),
    (req, res, next) => service.review(req.params.id, req.validatedBody)
      .then((result) => sendSuccess(res, { data: result, message: 'Đã xét duyệt hồ sơ và xếp lịch gửi email thông báo.' }))
      .catch(next))

  app.use('/api/admin', router)
}

module.exports = { initEmployerReviewController }
