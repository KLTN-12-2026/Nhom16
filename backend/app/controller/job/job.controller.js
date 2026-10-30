const express = require('express')
const { sendSuccess, ApiError } = require('../../util')
const { getActiveJobCategories, getPublicJobs, getPublicJobById } = require('../../service/job/job.service')

const initJobController = (app) => {
  const router = express.Router()

  // Không yêu cầu đăng nhập theo đúng PB01
  router.get('/', (req, res, next) => getPublicJobs(req.query)
    .then((data) => sendSuccess(res, { data, message: 'Lấy danh sách việc làm công khai thành công.' }))
    .catch(next))

  router.get('/categories', (req, res, next) => getActiveJobCategories()
    .then((categories) => sendSuccess(res, { data: { categories }, message: 'Lấy danh mục nghề nghiệp thành công.' }))
    .catch(next))

  router.get('/:id', (req, res, next) => getPublicJobById(req.params.id)
    .then((data) => {
      if (!data) throw new ApiError(404, 'Không tìm thấy tin tuyển dụng.', 'JOB_NOT_FOUND')
      return sendSuccess(res, { data, message: 'Lấy chi tiết việc làm thành công.' })
    })
    .catch(next))

  app.use('/api/jobs', router)
}

module.exports = { initJobController }
