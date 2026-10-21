const assert = require('node:assert/strict')

const { createReadiness, health } = require('../../app/controller/common')

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code
    return this
  },
  json(body) {
    this.body = body
    return this
  },
})

describe('health controller', () => {
  it('reports that the API process is up', () => {
    const response = createResponse()

    health({}, response)

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, { success: true, data: { status: 'up' } })
  })

  it('reports readiness when MySQL and Redis respond', async () => {
    const dependencies = {
      database: { authenticate: async () => true },
      redis: { ping: async () => 'PONG' },
    }
    const response = createResponse()

    await createReadiness(dependencies)({ id: 'request-1' }, response)

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, { success: true, data: { status: 'ready' } })
  })

  it('returns 503 when a required dependency is unavailable', async () => {
    const dependencies = {
      database: { authenticate: async () => true },
      redis: { ping: async () => Promise.reject(new Error('offline')) },
    }
    const response = createResponse()

    await createReadiness(dependencies)({ id: 'request-2' }, response)

    assert.equal(response.statusCode, 503)
    assert.equal(response.body.error.code, 'SERVICE_UNAVAILABLE')
    assert.equal(response.body.requestId, 'request-2')
  })
})
