const fs = require('node:fs/promises')
const path = require('node:path')
const { Op } = require('sequelize')
const { db } = require('../../db')
const { ApiError } = require('../../util')
const { getOwnedJob } = require('./employer-job.service')

const serializeJdFile = (file) => ({
  id: Number(file.id),
  jobId: Number(file.jobId),
  originalName: file.originalName,
  mimeType: file.mimeType,
  sizeBytes: Number(file.sizeBytes),
  createdAt: file.createdAt,
})

const uploadJobJd = async (userId, jobId, file) => {
  await getOwnedJob(userId, jobId)
  try {
    const record = await db.JobJdFile.create({
      jobId,
      uploadedById: userId,
      originalName: file.originalname,
      storedName: file.filename,
      storagePath: file.path,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    })
    return serializeJdFile(record)
  } catch (error) {
    await fs.unlink(file.path).catch(() => undefined)
    throw error
  }
}

const getOwnedJd = async (userId, jobId, fileId) => {
  await getOwnedJob(userId, jobId)
  const file = await db.JobJdFile.findOne({ where: { id: fileId, jobId } })
  if (!file) throw new ApiError(404, 'Không tìm thấy file JD.', 'JD_NOT_FOUND')
  return file
}

const downloadJobJd = async (userId, jobId, fileId) => {
  const file = await getOwnedJd(userId, jobId, fileId)
  return { absolutePath: path.resolve(file.storagePath), downloadName: file.originalName }
}

const downloadPublicJobJd = async (jobId, fileId) => {
  const job = await db.Job.findOne({
    where: {
      id: jobId,
      status: 'ACTIVE',
      isPublic: true,
      isHidden: false,
      deadline: { [Op.gte]: new Date().toISOString().slice(0, 10) },
    },
  })
  if (!job) throw new ApiError(404, 'Tin tuyển dụng không tồn tại hoặc đã hết hạn.', 'JOB_NOT_FOUND')

  const file = await db.JobJdFile.findOne({ where: { id: fileId, jobId } })
  if (!file) throw new ApiError(404, 'Không tìm thấy file JD.', 'JD_NOT_FOUND')
  return { absolutePath: path.resolve(file.storagePath), downloadName: file.originalName }
}

const deleteJobJd = async (userId, jobId, fileId) => {
  const file = await getOwnedJd(userId, jobId, fileId)
  await file.destroy()
  await fs.unlink(file.storagePath).catch(() => undefined)
  return { id: Number(file.id) }
}

module.exports = {
  deleteJobJd,
  downloadJobJd,
  downloadPublicJobJd,
  serializeJdFile,
  uploadJobJd,
}
