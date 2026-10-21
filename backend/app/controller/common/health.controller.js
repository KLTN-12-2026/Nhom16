const health = (request, response) => {
  response.status(200).json({ success: true, data: { status: 'up' } })
}

const createReadiness = ({ database, redis } = {}) => async (request, response) => {
  try {
    await database?.authenticate()
    await redis?.ping()
    response.status(200).json({ success: true, data: { status: 'ready' } })
  } catch (error) {
    response.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Dịch vụ chưa sẵn sàng.' },
      requestId: request.id,
    })
  }
}

module.exports = { createReadiness, health }
