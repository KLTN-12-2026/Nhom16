const assert = require('node:assert/strict')

const { ROLES } = require('../../../app/constants')
const { createRegistrationService } = require('../../../app/service/auth')

const payload = {
  fullName: 'Nguyễn Văn An',
  email: 'Candidate@Example.com',
  password: 'Secure@123',
  role: ROLES.CANDIDATE,
  recaptchaToken: 'captcha-token',
}

const createDependencies = (overrides = {}) => {
  const calls = []
  const dependencies = {
    transactionManager: {
      transaction: async (callback) => callback({ id: 'transaction' }),
    },
    userRepository: {
      findByEmail: async () => null,
      create: async (data) => {
        calls.push(['createUser', data])
        return { id: 10, ...data }
      },
      assignRole: async (userId, roleId) => calls.push(['assignRole', userId, roleId]),
    },
    roleRepository: {
      findByCode: async () => ({ id: 2, code: ROLES.CANDIDATE }),
    },
    identityRepository: {
      create: async (data) => calls.push(['createIdentity', data]),
    },
    passwordService: {
      hash: async () => 'hashed-password',
    },
    recaptchaVerifier: {
      verify: async (data) => calls.push(['verifyCaptcha', data]),
    },
    ...overrides,
  }

  return { calls, dependencies }
}

describe('registration service', () => {
  it('creates a pending candidate account without returning password data', async () => {
    const { calls, dependencies } = createDependencies()
    const service = createRegistrationService(dependencies)

    const result = await service.register(payload, { ip: '127.0.0.1' })

    assert.deepEqual(result, {
      id: 10,
      email: 'candidate@example.com',
      fullName: 'Nguyễn Văn An',
      role: ROLES.CANDIDATE,
      status: 'PENDING_VERIFICATION',
    })
    assert.equal('password' in result, false)
    assert.equal('passwordHash' in result, false)
    assert.deepEqual(calls[0], [
      'verifyCaptcha',
      { token: 'captcha-token', action: 'register', remoteIp: '127.0.0.1' },
    ])
    assert.equal(calls.find(([name]) => name === 'createUser')[1].passwordHash, 'hashed-password')
  })

  it('rejects duplicate email without creating a user', async () => {
    const userRepository = {
      findByEmail: async () => ({ id: 9 }),
      create: async () => assert.fail('must not create a duplicate user'),
      assignRole: async () => assert.fail('must not assign a role'),
    }
    const { dependencies } = createDependencies({ userRepository })
    const service = createRegistrationService(dependencies)

    await assert.rejects(service.register(payload), (error) => error.statusCode === 409 && error.code === 'EMAIL_ALREADY_EXISTS')
  })

  it('rejects administrator registration before external verification', async () => {
    const recaptchaVerifier = {
      verify: async () => assert.fail('must not verify captcha for a forbidden role'),
    }
    const { dependencies } = createDependencies({ recaptchaVerifier })
    const service = createRegistrationService(dependencies)

    await assert.rejects(
      service.register({ ...payload, role: ROLES.ADMIN }),
      (error) => error.statusCode === 403 && error.code === 'ROLE_NOT_ALLOWED',
    )
  })
})
