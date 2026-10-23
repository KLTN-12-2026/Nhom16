const { ApiError } = require('./api-error')

const validationError = (error, message = 'Dữ liệu gửi lên chưa hợp lệ.') => {
  const details = error.inner?.length
    ? error.inner.reduce((result, item) => ({ ...result, [item.path]: item.message }), {})
    : { form: error.message }

  return new ApiError(422, message, 'VALIDATION_ERROR', details)
}

const unauthorizedError = (message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.') => (
  new ApiError(401, message, 'UNAUTHORIZED')
)

module.exports = { unauthorizedError, validationError }
