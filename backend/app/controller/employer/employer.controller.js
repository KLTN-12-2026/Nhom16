const express = require('express')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { sendSuccess } = require('../../util')
const { getEmployerProfile, updateEmployerProfile } = require('../../service/employer/employer-profile.service')
const { validateUpdateEmployerProfile } = require('../../validator/employer/employer-profile.validator')
const { requireRole } = require('../../middleware/auth/require-role.middleware')
const { ROLES } = require('../../constants/access-control.constant')
const { validateJob, validateJobUpdate } = require('../../validator/employer/employer-job.validator')
const { validateApplicationStatus } = require('../../validator/candidate/application.validator')
const { createEmployerJob, getEmployerJob, listEmployerJobs, updateEmployerJob, changeEmployerJobStatus, cloneEmployerJob } = require('../../service/employer/employer-job.service')
const { getEmployerApplicationCv, listEmployerApplications, updateApplicationStatus } = require('../../service/candidate/application.service')
const { JOB_STATUS } = require('../../service/job/job-workflow.service')
const { uploadJobJd: uploadJobJdMiddleware } = require('../../middleware/upload')
const { uploadJobJd, downloadJobJd, deleteJobJd } = require('../../service/employer/job-jd.service')
const { listFavoriteCandidates, toggleFavoriteCandidate } = require('../../service/employer/favorite-candidate.service')

const initEmployerController = (app) => {
  const router = express.Router()
  const employerOnly = [authenticateJwt, requireRole(ROLES.EMPLOYER)]

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

  router.get('/jobs', ...employerOnly, (req, res, next) => listEmployerJobs(req.user.id).then(data => sendSuccess(res, { data, message: 'Lấy danh sách tin tuyển dụng thành công.' })).catch(next))
  router.get('/jobs/:id', ...employerOnly, (req, res, next) => getEmployerJob(req.user.id, req.params.id).then(data => sendSuccess(res, { data, message: 'Lấy tin tuyển dụng thành công.' })).catch(next))
  router.post('/jobs', ...employerOnly, validateBody(validateJob), (req, res, next) => createEmployerJob(req.user.id, req.validatedBody).then(data => sendSuccess(res, { statusCode: 201, data, message: 'Tạo tin tuyển dụng thành công.' })).catch(next))
  router.put('/jobs/:id', ...employerOnly, validateBody(validateJobUpdate), (req, res, next) => updateEmployerJob(req.user.id, req.params.id, req.validatedBody).then(data => sendSuccess(res, { data, message: 'Cập nhật tin tuyển dụng thành công.' })).catch(next))
  router.post('/jobs/:id/publish', ...employerOnly, (req, res, next) => changeEmployerJobStatus(req.user.id, req.params.id, JOB_STATUS.ACTIVE).then(data => sendSuccess(res, { data, message: 'Đăng tin tuyển dụng thành công.' })).catch(next))
  router.post('/jobs/:id/hide', ...employerOnly, (req, res, next) => changeEmployerJobStatus(req.user.id, req.params.id, JOB_STATUS.HIDDEN).then(data => sendSuccess(res, { data, message: 'Đã ẩn tin tuyển dụng.' })).catch(next))
  router.post('/jobs/:id/close', ...employerOnly, (req, res, next) => changeEmployerJobStatus(req.user.id, req.params.id, JOB_STATUS.CLOSED).then(data => sendSuccess(res, { data, message: 'Đã đóng tin tuyển dụng.' })).catch(next))
  router.post('/jobs/:id/clone', ...employerOnly, (req, res, next) => cloneEmployerJob(req.user.id, req.params.id).then(data => sendSuccess(res, { statusCode: 201, data, message: 'Nhân bản tin tuyển dụng thành công.' })).catch(next))
  router.post('/jobs/:id/jd', ...employerOnly, uploadJobJdMiddleware, (req, res, next) => uploadJobJd(req.user.id, req.params.id, req.file).then(data => sendSuccess(res, { statusCode: 201, data, message: 'Tải file JD thành công.' })).catch(next))
  router.get('/jobs/:id/jd/:fileId/download', ...employerOnly, (req, res, next) => downloadJobJd(req.user.id, req.params.id, req.params.fileId).then(file => res.download(file.absolutePath, file.downloadName)).catch(next))
  router.delete('/jobs/:id/jd/:fileId', ...employerOnly, (req, res, next) => deleteJobJd(req.user.id, req.params.id, req.params.fileId).then(data => sendSuccess(res, { data, message: 'Đã xóa file JD.' })).catch(next))
  router.get('/applications', ...employerOnly, (req, res, next) => listEmployerApplications(req.user.id, req.query).then(data => sendSuccess(res, { data, message: 'Lấy danh sách hồ sơ ứng tuyển thành công.' })).catch(next))
  router.patch('/applications/:id/status', ...employerOnly, validateBody(validateApplicationStatus), (req, res, next) => updateApplicationStatus(req.user.id, req.params.id, req.validatedBody).then(data => sendSuccess(res, { data, message: 'Cập nhật trạng thái hồ sơ thành công.' })).catch(next))
  router.get('/applications/:id/cv/download', ...employerOnly, (req, res, next) => getEmployerApplicationCv(req.user.id, req.params.id).then(file => res.download(file.absolutePath, file.downloadName)).catch(next))
  router.get('/favorite-candidates', ...employerOnly, (req, res, next) => listFavoriteCandidates(req.user.id).then(data => sendSuccess(res, { data, message: 'Lấy danh sách ứng viên đã lưu thành công.' })).catch(next))
  router.post('/favorite-candidates/:candidateId/toggle', ...employerOnly, (req, res, next) => toggleFavoriteCandidate(req.user.id, req.params.candidateId).then(data => sendSuccess(res, { data, message: data.favorite ? 'Đã lưu ứng viên.' : 'Đã bỏ lưu ứng viên.' })).catch(next))

  app.use('/api/employer', router)
}

module.exports = { initEmployerController }
