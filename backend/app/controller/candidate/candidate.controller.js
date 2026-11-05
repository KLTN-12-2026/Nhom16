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
const { requireRole } = require('../../middleware/auth/require-role.middleware')
const { ROLES } = require('../../constants/access-control.constant')
const { validateApplication } = require('../../validator/candidate/application.validator')
const { applyToJob, listCandidateApplications } = require('../../service/candidate/application.service')
const { listFavoriteJobs, toggleFavoriteJob } = require('../../service/candidate/favorite.service')
const { listNotifications, markNotificationRead } = require('../../service/candidate/notification.service')

const initCandidateController = (app) => {
  const router = express.Router()
  const candidateOnly = [authenticateJwt, requireRole(ROLES.CANDIDATE)]

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

  router.post('/applications', ...candidateOnly, validateBody(validateApplication), (req, res, next) => applyToJob(req.user.id, req.validatedBody).then(data => sendSuccess(res, { statusCode: 201, data, message: 'Nộp hồ sơ ứng tuyển thành công.' })).catch(next))
  router.get('/applications', ...candidateOnly, (req, res, next) => listCandidateApplications(req.user.id).then(data => sendSuccess(res, { data, message: 'Lấy danh sách việc đã ứng tuyển thành công.' })).catch(next))
  router.get('/favorite-jobs', ...candidateOnly, (req, res, next) => listFavoriteJobs(req.user.id).then(data => sendSuccess(res, { data, message: 'Lấy danh sách việc làm đã lưu thành công.' })).catch(next))
  router.post('/favorite-jobs/:jobId/toggle', ...candidateOnly, (req, res, next) => toggleFavoriteJob(req.user.id, req.params.jobId).then(data => sendSuccess(res, { data, message: data.favorite ? 'Đã lưu việc làm.' : 'Đã bỏ lưu việc làm.' })).catch(next))
  router.get('/notifications', ...candidateOnly, (req, res, next) => listNotifications(req.user.id).then(data => sendSuccess(res, { data, message: 'Lấy thông báo thành công.' })).catch(next))
  router.patch('/notifications/:id/read', ...candidateOnly, (req, res, next) => markNotificationRead(req.user.id, req.params.id).then(data => sendSuccess(res, { data, message: 'Đã đọc thông báo.' })).catch(next))

  app.use('/api/candidate', router)
}

module.exports = { initCandidateController }
