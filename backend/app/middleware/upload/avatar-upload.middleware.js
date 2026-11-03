const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const multer = require('multer')

const { env } = require('../../config')
const { ApiError } = require('../../util')

const avatarDirectory = path.join(env.upload.rootDirectory, 'candidate-avatars')
fs.mkdirSync(avatarDirectory, { recursive: true })

const allowedImageTypes = Object.freeze({
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
})

const upload = multer({
  storage: multer.diskStorage({
    destination: avatarDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()
      callback(null, `${crypto.randomUUID()}${extension}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    if (!allowedImageTypes[extension] || allowedImageTypes[extension] !== file.mimetype) {
      return callback(new ApiError(400, 'Ảnh đại diện chỉ chấp nhận định dạng JPG, PNG hoặc WEBP.', 'INVALID_AVATAR_FILE'))
    }
    return callback(null, true)
  },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
])

const uploadCandidateAvatar = (req, res, next) => upload(req, res, (error) => {
  if (!error) {
    const uploadedFile = req.files?.file?.[0] || req.files?.avatar?.[0]
    if (!uploadedFile) {
      return next(new ApiError(400, 'Vui lòng chọn file ảnh đại diện.', 'AVATAR_FILE_REQUIRED'))
    }
    req.file = uploadedFile
    return next()
  }
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return next(new ApiError(413, 'Ảnh đại diện không được vượt quá 5 MB.', 'AVATAR_FILE_TOO_LARGE'))
  }
  if (error instanceof ApiError) return next(error)
  return next(new ApiError(400, 'Không thể tải ảnh đại diện lên. Vui lòng kiểm tra lại file.', 'AVATAR_UPLOAD_FAILED'))
})

module.exports = { uploadCandidateAvatar, avatarDirectory }

