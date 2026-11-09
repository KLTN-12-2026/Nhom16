const { Op } = require('sequelize')
const { db } = require('../../db')
const { ApiError } = require('../../util')
const { serializeJob } = require('../job/job.service')

const listFavoriteJobs = async (userId) => {
  const favorites = await db.FavoriteJob.findAll({
    where: { candidateId: userId },
    include: [{ model: db.Job, as: 'job', where: { status: 'ACTIVE', isPublic: true, isHidden: false, deadline: { [Op.gte]: new Date().toISOString().slice(0, 10) } }, required: true, include: [{ model: db.JobCategory, as: 'category' }] }],
    order: [['createdAt', 'DESC']],
  })

  return favorites.map(favorite => ({
    id: Number(favorite.id),
    createdAt: favorite.createdAt,
    job: serializeJob(favorite.job),
  }))
}

const toggleFavoriteJob = async (userId, jobId) => {
  const job = await db.Job.findOne({ where: { id: jobId, status: 'ACTIVE', isPublic: true, isHidden: false } })
  if (!job) throw new ApiError(404, 'Không tìm thấy việc làm có thể lưu.', 'JOB_NOT_FOUND')
  const favorite = await db.FavoriteJob.findOne({ where: { candidateId: userId, jobId } })
  if (favorite) { await favorite.destroy(); return { favorite: false, jobId: Number(jobId) } }
  await db.FavoriteJob.create({ candidateId: userId, jobId })
  return { favorite: true, jobId: Number(jobId) }
}

module.exports = { listFavoriteJobs, toggleFavoriteJob }
