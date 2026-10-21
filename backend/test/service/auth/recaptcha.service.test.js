const assert = require('node:assert/strict')

const { createRecaptchaVerifier } = require('../../../app/service/auth')

const createFetch = (result, ok = true) => async () => ({ ok, status: ok ? 200 : 503, json: async () => result })

describe('reCAPTCHA verifier', () => {
  it('accepts a valid token for the expected action', async () => {
    const verifier = createRecaptchaVerifier({
      fetchImpl: createFetch({ success: true, score: 0.9, action: 'register', hostname: 'localhost' }),
      secretKey: 'secret',
      minimumScore: 0.5,
      allowedHostnames: ['localhost'],
    })

    const result = await verifier.verify({ token: 'token', action: 'register' })

    assert.deepEqual(result, { score: 0.9, hostname: 'localhost' })
  })

  it('rejects a token with a mismatched action', async () => {
    const verifier = createRecaptchaVerifier({
      fetchImpl: createFetch({ success: true, score: 0.9, action: 'login', hostname: 'localhost' }),
      secretKey: 'secret',
    })

    await assert.rejects(verifier.verify({ token: 'token', action: 'register' }), (error) => error.code === 'RECAPTCHA_FAILED')
  })

  it('rejects a low score and untrusted hostname', async () => {
    const verifier = createRecaptchaVerifier({
      fetchImpl: createFetch({ success: true, score: 0.2, action: 'register', hostname: 'unknown.test' }),
      secretKey: 'secret',
      minimumScore: 0.5,
      allowedHostnames: ['localhost'],
    })

    await assert.rejects(verifier.verify({ token: 'token', action: 'register' }), (error) => error.statusCode === 400)
  })

  it('maps provider outages to a service unavailable error', async () => {
    const verifier = createRecaptchaVerifier({ fetchImpl: async () => Promise.reject(new Error('network error')), secretKey: 'secret' })

    await assert.rejects(
      verifier.verify({ token: 'token', action: 'register' }),
      (error) => error.statusCode === 503 && error.code === 'RECAPTCHA_UNAVAILABLE',
    )
  })
})
