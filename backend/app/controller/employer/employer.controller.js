const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { sendSuccess } = require('../../util')
const { getEmployerProfile, updateEmployerProfile } = require('../../service/employer/employer-profile.service')
const { validateUpdateEmployerProfile } = require('../../validator/employer/employer-profile.validator')

const initEmployerController = (app) => {
  const router = express.Router()

  router.get('/profile', authenticateJwt, async (req, res, next) => {
    try {
      const data = await getEmployerProfile(req.user.id)
      sendSuccess(res, { data, message: 'Lấy hồ sơ doanh nghiệp thành công.' })
    } catch (err) { next(err) }
  })

  router.put('/profile', authenticateJwt, validateBody(validateUpdateEmployerProfile), async (req, res, next) => {
    try {
      const data = await updateEmployerProfile(req.user.id, req.validatedBody)
      sendSuccess(res, { data, message: 'Cập nhật hồ sơ doanh nghiệp thành công.' })
    } catch (err) { next(err) }
  })

  app.use('/api/employer', router)
}

module.exports = { initEmployerController }
