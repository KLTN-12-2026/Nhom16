class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
  }
}

module.exports = { ApiError }
