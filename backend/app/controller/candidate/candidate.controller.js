const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { sendSuccess } = require('../../util')
const { getCandidateProfile, updateCandidateProfile } = require('../../service/candidate/candidate-profile.service')
const { validateUpdateCandidateProfile } = require('../../validator/candidate/candidate-profile.validator')

const initCandidateController = (app) => {
  const router = express.Router()

  router.get('/profile', authenticateJwt, async (req, res, next) => {
    try {
      const data = await getCandidateProfile(req.user.id)
      sendSuccess(res, { data, message: 'Lấy hồ sơ ứng viên thành công.' })
    } catch (err) { next(err) }
  })

  router.put('/profile', authenticateJwt, validateBody(validateUpdateCandidateProfile), async (req, res, next) => {
    try {
      const data = await updateCandidateProfile(req.user.id, req.validatedBody)
      sendSuccess(res, { data, message: 'Cập nhật hồ sơ ứng viên thành công.' })
    } catch (err) { next(err) }
  })

  app.use('/api/candidate', router)
}

module.exports = { initCandidateController }
