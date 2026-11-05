const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const multer = require('multer')

const { env } = require('../../config')
const { ApiError } = require('../../util')

const logoDirectory = path.join(env.upload.rootDirectory, 'employer-logos')
fs.mkdirSync(logoDirectory, { recursive: true })

const allowedLogoTypes = Object.freeze({
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
})

const upload = multer({
  storage: multer.diskStorage({
    destination: logoDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()
      callback(null, `${crypto.randomUUID()}${extension}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    if (!allowedLogoTypes[extension] || allowedLogoTypes[extension] !== file.mimetype) {
      return callback(new ApiError(400, 'Logo chỉ chấp nhận định dạng JPG, PNG, WEBP hoặc SVG.', 'INVALID_LOGO_FILE'))
    }
    return callback(null, true)
  },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
])

const uploadEmployerLogo = (req, res, next) => upload(req, res, (error) => {
  if (!error) {
    const uploadedFile = req.files?.file?.[0] || req.files?.logo?.[0]
    if (!uploadedFile) {
      return next(new ApiError(400, 'Vui lòng chọn file logo doanh nghiệp.', 'LOGO_FILE_REQUIRED'))
    }
    req.file = uploadedFile
    return next()
  }
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return next(new ApiError(413, 'Logo không được vượt quá 5 MB.', 'LOGO_FILE_TOO_LARGE'))
  }
  if (error instanceof ApiError) return next(error)
  return next(new ApiError(400, 'Không thể tải logo lên. Vui lòng kiểm tra lại file.', 'LOGO_UPLOAD_FAILED'))
})

module.exports = { uploadEmployerLogo, logoDirectory }

