const express = require('express')

const { ROLES } = require('../../constants')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { requireRole } = require('../../middleware/auth/require-role.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const {
  confirmCandidateCvUpload,
  createCandidateCvUpload,
  deleteCandidateCv,
  getCandidateCvDownload,
  getCandidateCvAvatar,
  listCandidateCvs,
  queueCandidateCvExtraction,
  renameCandidateCv,
  setDefaultCandidateCv,
} = require('../../service/candidate/candidate-cv.service')
const { sendSuccess } = require('../../util')
const {
  validateConfirmCandidateCv,
  validatePresignCandidateCv,
  validateRenameCandidateCv,
} = require('../../validator/candidate/candidate-cv.validator')

const initCandidateCvController = (app, { cvQueue }) => {
  const router = express.Router()

  router.use(authenticateJwt, requireRole(ROLES.CANDIDATE))

  router.get('/', (req, res, next) => listCandidateCvs(req.user.id)
    .then((cvs) => sendSuccess(res, { data: { cvs } }))
    .catch(next))

  router.post('/uploads/presign', validateBody(validatePresignCandidateCv), (req, res, next) => createCandidateCvUpload(req.user.id, req.validatedBody)
    .then((upload) => sendSuccess(res, { data: upload }))
    .catch(next))

  router.post('/uploads/confirm', validateBody(validateConfirmCandidateCv), (req, res, next) => confirmCandidateCvUpload(req.user.id, req.validatedBody, cvQueue)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'CV đã tải lên và đang được xử lý.', statusCode: 201 }))
    .catch(next))

  router.patch('/:id', validateBody(validateRenameCandidateCv), (req, res, next) => renameCandidateCv(req.user.id, req.params.id, req.validatedBody.displayName)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'Đổi tên CV thành công.' }))
    .catch(next))

  router.put('/:id/default', (req, res, next) => setDefaultCandidateCv(req.user.id, req.params.id)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'Đã đặt CV mặc định.' }))
    .catch(next))

  router.put('/:id/extraction', (req, res, next) => queueCandidateCvExtraction(req.user.id, req.params.id, cvQueue)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'CV đã được đưa vào hàng đợi xử lý.' }))
    .catch(next))

  router.get('/:id/download', (req, res, next) => getCandidateCvDownload(req.user.id, req.params.id)
    .then(({ absolutePath, redirectUrl, downloadName }) => {
      if (redirectUrl) return res.redirect(redirectUrl)
      return res.download(absolutePath, downloadName, (error) => {
        if (error && !res.headersSent) next(error)
      })
    })
    .catch(next))

  router.get('/:id/avatar', (req, res, next) => getCandidateCvAvatar(req.user.id, req.params.id)
    .then(({ absolutePath, redirectUrl }) => {
      if (redirectUrl) return res.redirect(redirectUrl)
      return res.sendFile(absolutePath, (error) => {
        if (error && !res.headersSent) next(error)
      })
    })
    .catch(next))

  router.delete('/:id', (req, res, next) => deleteCandidateCv(req.user.id, req.params.id)
    .then((result) => sendSuccess(res, { data: result, message: 'Đã xóa CV.' }))
    .catch(next))

  app.use('/api/candidate/cvs', router)
}

module.exports = { initCandidateCvController }
