const path = require('node:path')
const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { uploadCandidateAvatar, avatarDirectory } = require('../../middleware/upload')
const { sendSuccess } = require('../../util')
const {
  getCandidateProfile,
  updateCandidateProfile,
  saveCandidateAvatar,
  getCandidateAvatarPath,
  deleteCandidateAvatar,
} = require('../../service/candidate/candidate-profile.service')
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

  router.post('/profile/avatar', authenticateJwt, uploadCandidateAvatar, async (req, res, next) => {
    try {
      const data = await saveCandidateAvatar(req.user.id, req.file)
      sendSuccess(res, { data, message: 'Cập nhật ảnh đại diện thành công.' })
    } catch (err) { next(err) }
  })

  router.get('/profile/avatar', authenticateJwt, async (req, res, next) => {
    try {
      const absolutePath = await getCandidateAvatarPath(req.user.id)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.sendFile(absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    } catch (err) { next(err) }
  })

  router.get('/avatar/:filename', async (req, res, next) => {
    try {
      const safeFilename = path.basename(req.params.filename)
      const absolutePath = path.join(avatarDirectory, safeFilename)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.sendFile(absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    } catch (err) { next(err) }
  })

  router.get('/user/:userId/avatar', async (req, res, next) => {
    try {
      const absolutePath = await getCandidateAvatarPath(req.params.userId)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.sendFile(absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    } catch (err) { next(err) }
  })

  router.delete('/profile/avatar', authenticateJwt, async (req, res, next) => {
    try {
      const data = await deleteCandidateAvatar(req.user.id)
      sendSuccess(res, { data, message: 'Đã xóa ảnh đại diện.' })
    } catch (err) { next(err) }
  })

  app.use('/api/candidate', router)
}

module.exports = { initCandidateController }
