const fs = require('node:fs/promises')
const path = require('node:path')
const { db } = require('../../db')
const { ApiError } = require('../../util')
const { getOwnedJob } = require('./employer-job.service')

const uploadJobJd = async (userId, jobId, file) => {
  await getOwnedJob(userId, jobId)
  try {
    return await db.JobJdFile.create({ jobId, uploadedById: userId, originalName: file.originalname, storedName: file.filename, storagePath: file.path, mimeType: file.mimetype, sizeBytes: file.size })
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

const deleteJobJd = async (userId, jobId, fileId) => {
  const file = await getOwnedJd(userId, jobId, fileId)
  await file.destroy()
  await fs.unlink(file.storagePath).catch(() => undefined)
  return { id: Number(file.id) }
}

module.exports = { deleteJobJd, downloadJobJd, uploadJobJd }
