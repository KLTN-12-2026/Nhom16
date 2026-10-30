const fs = require('node:fs/promises')
const path = require('node:path')

const { env } = require('../../config')
const { db } = require('../../db')
const { ApiError } = require('../../util')
const { extractCvData } = require('./cv-extraction.service')

const backendRoot = path.resolve(__dirname, '../../..')
const cvRoot = path.resolve(env.upload.rootDirectory, 'cv')
const avatarRoot = path.resolve(env.upload.rootDirectory, 'cv-avatars')

const toCandidateCv = (cv) => ({
  id: Number(cv.id),
  displayName: cv.displayName,
  originalName: cv.originalName,
  mimeType: cv.mimeType,
  sizeBytes: Number(cv.sizeBytes),
  isDefault: Boolean(cv.isDefault),
  candidateName: cv.candidateName,
  candidateEmail: cv.candidateEmail,
  candidatePhone: cv.candidatePhone,
  headline: cv.headline,
  hasAvatar: Boolean(cv.avatarPath),
  extractionStatus: cv.extractionStatus,
  createdAt: cv.createdAt,
  updatedAt: cv.updatedAt,
})

const resolveStoredPath = (storagePath, allowedRoot = cvRoot) => {
  const absolutePath = path.resolve(backendRoot, storagePath)
  if (absolutePath !== allowedRoot && !absolutePath.startsWith(`${allowedRoot}${path.sep}`)) {
    throw new ApiError(500, 'Đường dẫn CV không hợp lệ.', 'INVALID_CV_STORAGE_PATH')
  }
  return absolutePath
}

const findOwnedCv = async (userId, id, options = {}) => {
  const cv = await db.CandidateCv.findOne({ where: { id, userId }, ...options })
  if (!cv) throw new ApiError(404, 'Không tìm thấy CV.', 'CV_NOT_FOUND')
  return cv
}

const listCandidateCvs = async (userId) => {
  const cvs = await db.CandidateCv.findAll({
    where: { userId },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
  })
  return cvs.map(toCandidateCv)
}

const createCandidateCv = async (userId, file, displayName, cvQueue) => {
  if (!file) throw new ApiError(400, 'Vui lòng chọn file CV.', 'CV_FILE_REQUIRED')

  const normalizedDisplayName = displayName?.trim() || path.parse(file.originalname).name
  if (normalizedDisplayName.length > 180) {
    await fs.unlink(file.path).catch(() => undefined)
    throw new ApiError(400, 'Tên CV không được vượt quá 180 ký tự.', 'INVALID_CV_DISPLAY_NAME')
  }

  const storagePath = path.relative(backendRoot, file.path)
  let cv
  try {
    cv = await db.sequelize.transaction(async (transaction) => {
      const existingCount = await db.CandidateCv.count({ where: { userId }, transaction })
      return db.CandidateCv.create({
        userId,
        displayName: normalizedDisplayName,
        originalName: file.originalname,
        storedName: file.filename,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        isDefault: existingCount === 0,
        extractionStatus: 'pending',
      }, { transaction })
    })
    await cvQueue.addExtraction(Number(cv.id))
    return toCandidateCv(cv)
  } catch (error) {
    if (cv) await cv.destroy().catch(() => undefined)
    await fs.unlink(file.path).catch(() => undefined)
    throw error
  }
}

const renameCandidateCv = async (userId, id, displayName) => {
  const cv = await findOwnedCv(userId, id)
  await cv.update({ displayName: displayName.trim() })
  return toCandidateCv(cv)
}

const setDefaultCandidateCv = async (userId, id) => db.sequelize.transaction(async (transaction) => {
  const cv = await findOwnedCv(userId, id, { transaction, lock: transaction.LOCK.UPDATE })
  await db.CandidateCv.update({ isDefault: false }, { where: { userId }, transaction })
  await cv.update({ isDefault: true }, { transaction })
  return toCandidateCv(cv)
})

const deleteCandidateCv = async (userId, id) => {
  const deleted = await db.sequelize.transaction(async (transaction) => {
    const cv = await findOwnedCv(userId, id, { transaction, lock: transaction.LOCK.UPDATE })
    const result = {
      path: resolveStoredPath(cv.storagePath),
      avatarPath: cv.avatarPath ? resolveStoredPath(cv.avatarPath, avatarRoot) : null,
      wasDefault: cv.isDefault,
    }
    await cv.destroy({ transaction })

    if (result.wasDefault) {
      const replacement = await db.CandidateCv.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (replacement) await replacement.update({ isDefault: true }, { transaction })
    }
    return result
  })

  await fs.unlink(deleted.path).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
  if (deleted.avatarPath) {
    await fs.unlink(deleted.avatarPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
  return { id: Number(id) }
}

const getCandidateCvDownload = async (userId, id) => {
  const cv = await findOwnedCv(userId, id)
  return {
    absolutePath: resolveStoredPath(cv.storagePath),
    downloadName: cv.originalName,
  }
}

const getCandidateCvAvatar = async (userId, id) => {
  const cv = await findOwnedCv(userId, id)
  if (!cv.avatarPath) throw new ApiError(404, 'CV không có ảnh đại diện.', 'CV_AVATAR_NOT_FOUND')
  return resolveStoredPath(cv.avatarPath, avatarRoot)
}

const processCandidateCv = async (id) => {
  const cv = await db.CandidateCv.findByPk(id)
  if (!cv) return { skipped: true }
  await cv.update({ extractionStatus: 'processing' })
  const absolutePath = resolveStoredPath(cv.storagePath)
  const extracted = await extractCvData(absolutePath, cv.mimeType)
  const avatarPath = extracted.avatarAbsolutePath ? path.relative(backendRoot, extracted.avatarAbsolutePath) : null
  const previousAvatarPath = cv.avatarPath ? resolveStoredPath(cv.avatarPath, avatarRoot) : null

  try {
    await cv.update({
      candidateName: extracted.candidateName,
      candidateEmail: extracted.candidateEmail,
      candidatePhone: extracted.candidatePhone,
      headline: extracted.headline,
      avatarPath,
      extractionStatus: extracted.extractionStatus,
    })
  } catch (error) {
    if (extracted.avatarAbsolutePath) await fs.unlink(extracted.avatarAbsolutePath).catch(() => undefined)
    throw error
  }

  if (previousAvatarPath && previousAvatarPath !== extracted.avatarAbsolutePath) {
    await fs.unlink(previousAvatarPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
  return toCandidateCv(cv)
}

const queueCandidateCvExtraction = async (userId, id, cvQueue) => {
  const cv = await findOwnedCv(userId, id)
  await cv.update({ extractionStatus: 'pending' })
  await cvQueue.addExtraction(Number(cv.id))
  return toCandidateCv(cv)
}

module.exports = {
  createCandidateCv,
  deleteCandidateCv,
  getCandidateCvDownload,
  getCandidateCvAvatar,
  listCandidateCvs,
  processCandidateCv,
  queueCandidateCvExtraction,
  renameCandidateCv,
  setDefaultCandidateCv,
}
