const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const multer = require('multer')

const { env } = require('../../config')
const { ApiError } = require('../../util')

const cvDirectory = path.join(env.upload.rootDirectory, 'cv')
fs.mkdirSync(cvDirectory, { recursive: true })

const allowedTypes = Object.freeze({
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
})

const upload = multer({
  storage: multer.diskStorage({
    destination: cvDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()
      callback(null, `${crypto.randomUUID()}${extension}`)
    },
  }),
  limits: { fileSize: env.upload.cvMaxBytes, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    if (!allowedTypes[extension] || allowedTypes[extension] !== file.mimetype) {
      return callback(new ApiError(400, 'CV chỉ chấp nhận file PDF hoặc DOCX.', 'INVALID_CV_FILE'))
    }
    return callback(null, true)
  },
}).single('file')

const uploadCandidateCv = (req, res, next) => upload(req, res, (error) => {
  if (!error) return next()
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return next(new ApiError(413, `CV không được vượt quá ${Math.floor(env.upload.cvMaxBytes / 1024 / 1024)} MB.`, 'CV_FILE_TOO_LARGE'))
  }
  if (error instanceof ApiError) return next(error)
  return next(new ApiError(400, 'Không thể tải CV lên. Vui lòng kiểm tra lại file.', 'CV_UPLOAD_FAILED'))
})

module.exports = { uploadCandidateCv }
