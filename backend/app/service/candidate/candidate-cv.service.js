const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')

const { env } = require('../../config')
const { db } = require('../../db')
const { ApiError } = require('../../util')
const { extractCvData } = require('./cv-extraction.service')
const {
  createDownloadUrl,
  createUploadPolicy,
  deleteObject,
  downloadObjectToFile,
  headObject,
  uploadFile,
} = require('../storage')

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

const CV_MIME_EXTENSIONS = Object.freeze({
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
})

const assertCvSize = (sizeBytes) => {
  if (!sizeBytes || sizeBytes > env.upload.cvMaxBytes) {
    throw new ApiError(413, `CV không được vượt quá ${Math.floor(env.upload.cvMaxBytes / 1024 / 1024)} MB.`, 'CV_FILE_TOO_LARGE')
  }
}

const createCandidateCvUpload = async (userId, { fileName, contentType, sizeBytes }) => {
  assertCvSize(sizeBytes)
  const extension = CV_MIME_EXTENSIONS[contentType]
  if (!extension || path.extname(fileName).slice(1).toLowerCase() !== extension) {
    throw new ApiError(400, 'Phần mở rộng file không phù hợp với định dạng CV.', 'INVALID_CV_EXTENSION')
  }
  const objectKey = `candidate-cvs/${userId}/${crypto.randomUUID()}.${extension}`
  return createUploadPolicy({ key: objectKey, contentType, maxBytes: env.upload.cvMaxBytes })
}

const confirmCandidateCvUpload = async (userId, form, cvQueue) => {
  assertCvSize(form.sizeBytes)
  const requiredPrefix = `candidate-cvs/${userId}/`
  if (!form.objectKey.startsWith(requiredPrefix) || form.objectKey.includes('..')) {
    throw new ApiError(403, 'Bạn không có quyền xác nhận file này.', 'INVALID_CV_OBJECT_KEY')
  }
  const object = await headObject(form.objectKey).catch(() => {
    throw new ApiError(400, 'Không tìm thấy file đã tải lên.', 'CV_OBJECT_NOT_FOUND')
  })
  const actualSize = Number(object.ContentLength || 0)
  const actualType = String(object.ContentType || '').split(';')[0]
  if (actualSize !== Number(form.sizeBytes) || actualSize > env.upload.cvMaxBytes || actualType !== form.contentType) {
    await deleteObject(form.objectKey).catch(() => undefined)
    throw new ApiError(400, 'File tải lên không khớp với thông tin đã đăng ký.', 'CV_OBJECT_MISMATCH')
  }

  const normalizedDisplayName = form.displayName?.trim() || path.parse(form.fileName).name
  const cv = await db.sequelize.transaction(async (transaction) => {
    const existingCount = await db.CandidateCv.count({ where: { userId }, transaction })
    return db.CandidateCv.create({
      userId,
      displayName: normalizedDisplayName,
      originalName: form.fileName,
      storedName: path.basename(form.objectKey),
      storagePath: form.objectKey,
      storageProvider: 's3',
      objectEtag: object.ETag || null,
      mimeType: form.contentType,
      sizeBytes: actualSize,
      isDefault: existingCount === 0,
      extractionStatus: 'pending',
    }, { transaction })
  }).catch(async (error) => {
    await deleteObject(form.objectKey).catch(() => undefined)
    throw error
  })

  try {
    await cvQueue.addExtraction(Number(cv.id))
  } catch (error) {
    await cv.update({ extractionStatus: 'failed' })
    throw new ApiError(503, 'Đã lưu CV nhưng chưa thể đưa vào hàng đợi xử lý.', 'CV_QUEUE_UNAVAILABLE')
  }
  return toCandidateCv(cv)
}

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

const createCandidateCv = async (userId, file, displayName) => {
  if (!file) throw new ApiError(400, 'Vui lòng chọn file CV.', 'CV_FILE_REQUIRED')

  const normalizedDisplayName = displayName?.trim() || path.parse(file.originalname).name
  if (normalizedDisplayName.length > 180) {
    await fs.unlink(file.path).catch(() => undefined)
    throw new ApiError(400, 'Tên CV không được vượt quá 180 ký tự.', 'INVALID_CV_DISPLAY_NAME')
  }

  const storagePath = path.relative(backendRoot, file.path)
  const extracted = await extractCvData(file.path, file.mimetype)
  const avatarPath = extracted.avatarAbsolutePath ? path.relative(backendRoot, extracted.avatarAbsolutePath) : null
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const existingCount = await db.CandidateCv.count({ where: { userId }, transaction })
      const cv = await db.CandidateCv.create({
        userId,
        displayName: normalizedDisplayName,
        originalName: file.originalname,
        storedName: file.filename,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        isDefault: existingCount === 0,
        candidateName: extracted.candidateName,
        candidateEmail: extracted.candidateEmail,
        candidatePhone: extracted.candidatePhone,
        headline: extracted.headline,
        avatarPath,
        extractionStatus: extracted.extractionStatus,
      }, { transaction })
      return toCandidateCv(cv)
    })
  } catch (error) {
    await fs.unlink(file.path).catch(() => undefined)
    if (extracted.avatarAbsolutePath) await fs.unlink(extracted.avatarAbsolutePath).catch(() => undefined)
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
      path: cv.storageProvider === 's3' ? null : resolveStoredPath(cv.storagePath),
      avatarPath: cv.avatarPath && cv.storageProvider !== 's3' ? resolveStoredPath(cv.avatarPath, avatarRoot) : null,
      avatarObjectKey: cv.storageProvider === 's3' ? cv.avatarPath : null,
      wasDefault: cv.isDefault,
    }
    const storageProvider = cv.storageProvider
    const objectKey = cv.storagePath
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
    return { ...result, storageProvider, objectKey }
  })

  if (deleted.storageProvider === 's3') await deleteObject(deleted.objectKey)
  else await fs.unlink(deleted.path).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  if (deleted.avatarPath) {
    await fs.unlink(deleted.avatarPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
  if (deleted.storageProvider === 's3' && deleted.avatarObjectKey) {
    await deleteObject(deleted.avatarObjectKey).catch(() => undefined)
  }
  return { id: Number(id) }
}

const getCandidateCvDownload = async (userId, id) => {
  const cv = await findOwnedCv(userId, id)
  if (cv.storageProvider === 's3') {
    return { redirectUrl: await createDownloadUrl(cv.storagePath, cv.originalName), downloadName: cv.originalName }
  }
  return {
    absolutePath: resolveStoredPath(cv.storagePath),
    downloadName: cv.originalName,
  }
}

const getCandidateCvAvatar = async (userId, id) => {
  const cv = await findOwnedCv(userId, id)
  if (!cv.avatarPath) throw new ApiError(404, 'CV không có ảnh đại diện.', 'CV_AVATAR_NOT_FOUND')
  if (cv.storageProvider === 's3') return { redirectUrl: await createDownloadUrl(cv.avatarPath) }
  return { absolutePath: resolveStoredPath(cv.avatarPath, avatarRoot) }
}

const processCandidateCv = async (id) => {
  const cv = await db.CandidateCv.findByPk(id)
  if (!cv) return { skipped: true }
  await cv.update({ extractionStatus: 'processing' })
  const temporaryPath = path.join(os.tmpdir(), `candidate-cv-${id}-${crypto.randomUUID()}.${CV_MIME_EXTENSIONS[cv.mimeType] || 'bin'}`)
  let sourcePath
  try {
    sourcePath = cv.storageProvider === 's3'
      ? await downloadObjectToFile(cv.storagePath, temporaryPath)
      : resolveStoredPath(cv.storagePath)
    const extracted = await extractCvData(sourcePath, cv.mimeType)
    let avatarPath = null
    if (extracted.avatarAbsolutePath) {
      if (cv.storageProvider === 's3') {
        avatarPath = `candidate-cvs/${cv.userId}/avatars/${crypto.randomUUID()}.webp`
        await uploadFile({ key: avatarPath, path: extracted.avatarAbsolutePath, contentType: 'image/webp' })
        await fs.unlink(extracted.avatarAbsolutePath).catch(() => undefined)
      } else {
        avatarPath = path.relative(backendRoot, extracted.avatarAbsolutePath)
      }
    }
    if (cv.avatarPath && cv.storageProvider === 's3' && cv.avatarPath !== avatarPath) {
      await deleteObject(cv.avatarPath).catch(() => undefined)
    }
    await cv.update({
      candidateName: extracted.candidateName,
      candidateEmail: extracted.candidateEmail,
      candidatePhone: extracted.candidatePhone,
      headline: extracted.headline,
      avatarPath,
      extractionStatus: extracted.extractionStatus,
    })
    return toCandidateCv(cv)
  } catch (error) {
    await cv.update({ extractionStatus: 'failed' })
    throw error
  } finally {
    if (cv.storageProvider === 's3') await fs.unlink(temporaryPath).catch(() => undefined)
  }
}

const extractCandidateCv = async (userId, id) => {
  const cv = await findOwnedCv(userId, id)
  if (cv.storageProvider === 's3') return processCandidateCv(id)
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
  confirmCandidateCvUpload,
  createCandidateCv,
  createCandidateCvUpload,
  deleteCandidateCv,
  getCandidateCvDownload,
  getCandidateCvAvatar,
  extractCandidateCv,
  listCandidateCvs,
  processCandidateCv,
  queueCandidateCvExtraction,
  renameCandidateCv,
  setDefaultCandidateCv,
}
