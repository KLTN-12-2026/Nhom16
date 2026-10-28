const express = require('express')
const { sendSuccess, ApiError } = require('../../util')
const { getPublicJobs, getPublicJobById } = require('../../service/job/job.service')

const initJobController = (app) => {
  const router = express.Router()

  // Không yêu cầu đăng nhập theo đúng PB01
  router.get('/', async (req, res, next) => {
    try {
      const data = await getPublicJobs(req.query)
      sendSuccess(res, { data, message: 'Lấy danh sách việc làm công khai thành công.' })
    } catch (err) { next(err) }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const data = await getPublicJobById(req.params.id)
      if (!data) throw new ApiError(404, 'Không tìm thấy tin tuyển dụng.', 'JOB_NOT_FOUND')
      sendSuccess(res, { data, message: 'Lấy chi tiết việc làm thành công.' })
    } catch (err) { next(err) }
  })

  app.use('/api/jobs', router)
}

module.exports = { initJobController }
