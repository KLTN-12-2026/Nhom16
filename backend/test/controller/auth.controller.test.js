const assert = require('node:assert/strict')

const { createAuthController } = require('../../app/controller/auth')

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

describe('auth controller', () => {
  it('returns 201 and a safe user after registration', async () => {
    const expectedUser = { id: 1, email: 'candidate@example.com', role: 'CANDIDATE' }
    const controller = createAuthController({
      validateRegisterPayload: async (body) => ({ ...body, email: body.email.toLowerCase() }),
      registrationService: { register: async () => expectedUser },
    })
    const response = createResponse()

    await controller.register(
      { body: { email: 'Candidate@Example.com' }, ip: '127.0.0.1' },
      response,
      assert.fail,
    )

    assert.equal(response.statusCode, 201)
    assert.deepEqual(response.body.data.user, expectedUser)
  })

  it('forwards validation and service errors to error middleware', async () => {
    const expectedError = new Error('invalid')
    const controller = createAuthController({
      validateRegisterPayload: async () => Promise.reject(expectedError),
      registrationService: { register: async () => assert.fail('service must not be called') },
    })
    let forwardedError

    await controller.register({}, createResponse(), (error) => {
      forwardedError = error
    })

    assert.equal(forwardedError, expectedError)
  })
})
