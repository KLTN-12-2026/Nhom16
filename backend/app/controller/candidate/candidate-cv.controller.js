const express = require('express')

const { ROLES } = require('../../constants')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { requireRole } = require('../../middleware/auth/require-role.middleware')
const { uploadCandidateCv } = require('../../middleware/upload/cv-upload.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const {
  createCandidateCv,
  deleteCandidateCv,
  extractCandidateCv,
  getCandidateCvDownload,
  getCandidateCvAvatar,
  listCandidateCvs,
  renameCandidateCv,
  setDefaultCandidateCv,
} = require('../../service/candidate/candidate-cv.service')
const { sendSuccess } = require('../../util')
const { validateRenameCandidateCv } = require('../../validator/candidate/candidate-cv.validator')

const initCandidateCvController = (app) => {
  const router = express.Router()

  router.use(authenticateJwt, requireRole(ROLES.CANDIDATE))

  router.get('/', (req, res, next) => listCandidateCvs(req.user.id)
    .then((cvs) => sendSuccess(res, { data: { cvs } }))
    .catch(next))

  router.post('/', uploadCandidateCv, (req, res, next) => createCandidateCv(req.user.id, req.file, req.body.displayName)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'Tải CV lên thành công.', statusCode: 201 }))
    .catch(next))

  router.patch('/:id', validateBody(validateRenameCandidateCv), (req, res, next) => renameCandidateCv(req.user.id, req.params.id, req.validatedBody.displayName)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'Đổi tên CV thành công.' }))
    .catch(next))

  router.put('/:id/default', (req, res, next) => setDefaultCandidateCv(req.user.id, req.params.id)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'Đã đặt CV mặc định.' }))
    .catch(next))

  router.put('/:id/extraction', (req, res, next) => extractCandidateCv(req.user.id, req.params.id)
    .then((cv) => sendSuccess(res, { data: { cv }, message: 'Đã đọc lại thông tin CV.' }))
    .catch(next))

  router.get('/:id/download', (req, res, next) => getCandidateCvDownload(req.user.id, req.params.id)
    .then(({ absolutePath, downloadName }) => res.download(absolutePath, downloadName, (error) => {
      if (error && !res.headersSent) next(error)
    }))
    .catch(next))

  router.get('/:id/avatar', (req, res, next) => getCandidateCvAvatar(req.user.id, req.params.id)
    .then((absolutePath) => res.sendFile(absolutePath, (error) => {
      if (error && !res.headersSent) next(error)
    }))
    .catch(next))

  router.delete('/:id', (req, res, next) => deleteCandidateCv(req.user.id, req.params.id)
    .then((result) => sendSuccess(res, { data: result, message: 'Đã xóa CV.' }))
    .catch(next))

  app.use('/api/candidate/cvs', router)
}

module.exports = { initCandidateCvController }
