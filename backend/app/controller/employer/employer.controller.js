const path = require('node:path')
const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { uploadEmployerLogo, logoDirectory } = require('../../middleware/upload')
const { sendSuccess } = require('../../util')
const {
  getEmployerProfile,
  updateEmployerProfile,
  saveEmployerLogo,
  getEmployerLogoPath,
  deleteEmployerLogo,
} = require('../../service/employer/employer-profile.service')
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

  router.post('/profile/logo', authenticateJwt, uploadEmployerLogo, async (req, res, next) => {
    try {
      const data = await saveEmployerLogo(req.user.id, req.file)
      sendSuccess(res, { data, message: 'Cập nhật logo doanh nghiệp thành công.' })
    } catch (err) { next(err) }
  })

  router.get('/profile/logo', authenticateJwt, async (req, res, next) => {
    try {
      const result = await getEmployerLogoPath(req.user.id)
      if (result.isExternal) {
        return res.redirect(result.url)
      }
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.sendFile(result.absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    } catch (err) { next(err) }
  })

  router.get('/logo/:filename', async (req, res, next) => {
    try {
      const safeFilename = path.basename(req.params.filename)
      const absolutePath = path.join(logoDirectory, safeFilename)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.sendFile(absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    } catch (err) { next(err) }
  })

  router.get('/user/:userId/logo', async (req, res, next) => {
    try {
      const result = await getEmployerLogoPath(req.params.userId)
      if (result.isExternal) {
        return res.redirect(result.url)
      }
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.sendFile(result.absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    } catch (err) { next(err) }
  })

  router.delete('/profile/logo', authenticateJwt, async (req, res, next) => {
    try {
      const data = await deleteEmployerLogo(req.user.id)
      sendSuccess(res, { data, message: 'Đã xóa logo doanh nghiệp.' })
    } catch (err) { next(err) }
  })

  app.use('/api/employer', router)
}

module.exports = { initEmployerController }
