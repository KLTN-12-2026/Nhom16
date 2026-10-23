const { sendSuccess } = require('../../util')

const health = (request, response) => {
  return sendSuccess(response, { data: { status: 'up' } })
}

const createReadiness = ({ database, redis } = {}) => async (request, response) => {
  try {
    await database?.authenticate()
    await redis?.ping()
    return sendSuccess(response, { data: { status: 'ready' } })
  } catch (error) {
    response.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Dịch vụ chưa sẵn sàng.' },
      requestId: request.id,
    })
  }
}

module.exports = { createReadiness, health }
