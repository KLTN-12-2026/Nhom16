const { env } = require('../../config/env')
const { createAuthController, createAuthRouter } = require('../../controller/auth')
const { initializeModels } = require('../../db/models')
const { createAuthRepositories } = require('../../db/repositories')
const { validateRegisterPayload } = require('../../validator/auth')
const { createPasswordService } = require('./password.service')
const { createRecaptchaVerifier } = require('./recaptcha.service')
const { createRegistrationService } = require('./registration.service')

const createAuthModule = ({ database }) => {
  const repositories = createAuthRepositories(initializeModels(database))
  const recaptchaVerifier = createRecaptchaVerifier({
    secretKey: env.recaptcha.secretKey,
    minimumScore: env.recaptcha.minimumScore,
    allowedHostnames: ['localhost', '127.0.0.1'],
  })
  const registrationService = createRegistrationService({
    transactionManager: database,
    ...repositories,
    passwordService: createPasswordService(),
    recaptchaVerifier,
  })
  const authController = createAuthController({ registrationService, validateRegisterPayload })

  return { router: createAuthRouter({ authController }) }
}

module.exports = { createAuthModule }
