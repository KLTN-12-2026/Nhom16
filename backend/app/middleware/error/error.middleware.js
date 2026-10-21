const { ApiError } = require('../../util/api-error')

const notFound = (request, response, next) => {
  next(new ApiError(404, 'Không tìm thấy tài nguyên được yêu cầu.', 'NOT_FOUND'))
}

const errorHandler = (error, request, response, next) => {
  if (response.headersSent) {
    return next(error)
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500
  const message = error instanceof ApiError ? error.message : 'Hệ thống đang bận. Vui lòng thử lại sau.'
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR'

  return response.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details ? { details: error.details } : {}),
    },
    requestId: request.id,
  })
}

module.exports = { errorHandler, notFound }
