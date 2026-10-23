const sendSuccess = (response, { data = null, message, statusCode = 200 } = {}) => response.status(statusCode).json({
  success: true,
  data,
  ...(message ? { message } : {}),
})

module.exports = { sendSuccess }
