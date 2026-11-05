const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const multer = require('multer')
const { env } = require('../../config')
const { ApiError } = require('../../util')

const jdDirectory = path.join(env.upload.rootDirectory, 'jd')
fs.mkdirSync(jdDirectory, { recursive: true })
const types = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
const upload = multer({
  storage: multer.diskStorage({ destination: jdDirectory, filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: env.upload.cvMaxBytes, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    return types[extension] === file.mimetype ? callback(null, true) : callback(new ApiError(400, 'JD chỉ chấp nhận file PDF hoặc DOCX.', 'INVALID_JD_FILE'))
  },
}).single('file')

const uploadJobJd = (req, res, next) => upload(req, res, error => {
  if (!error) return req.file ? next() : next(new ApiError(400, 'Vui lòng chọn file JD.', 'JD_FILE_REQUIRED'))
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return next(new ApiError(413, 'JD không được vượt quá 5 MB.', 'JD_FILE_TOO_LARGE'))
  return next(error instanceof ApiError ? error : new ApiError(400, 'Không thể tải JD lên.', 'JD_UPLOAD_FAILED'))
})

module.exports = { jdDirectory, uploadJobJd }
