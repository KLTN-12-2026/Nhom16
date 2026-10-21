const { env } = require('../../config/env')
const { createAuthController, createAuthRouter } = require('../../controller/auth')
const { initializeModels } = require('../../db/models')
const { createAuthRepositories } = require('../../db/repositories')
const { validateGooglePayload, validateLoginPayload, validateRegisterPayload } = require('../../validator/auth')
const { createAuthenticationService } = require('./authentication.service')
const { createGoogleAuthService } = require('./google-auth.service')
const { createPasswordService } = require('./password.service')
const { createRecaptchaVerifier } = require('./recaptcha.service')
const { createRegistrationService } = require('./registration.service')
const { createTokenService } = require('./token.service')

const createAuthModule = ({ database }) => {
  const repositories = createAuthRepositories(initializeModels(database))
  const recaptchaVerifier = createRecaptchaVerifier({
    secretKey: env.recaptcha.secretKey,
    minimumScore: env.recaptcha.minimumScore,
    allowedHostnames: ['localhost', '127.0.0.1'],
  })
  const passwordService = createPasswordService()
  const tokenService = createTokenService({ secret: env.auth.accessSecret, expiresIn: env.auth.accessTokenExpiresIn })
  const registrationService = createRegistrationService({
    transactionManager: database,
    ...repositories,
    passwordService,
    recaptchaVerifier,
  })
  const authenticationService = createAuthenticationService({ ...repositories, passwordService, recaptchaVerifier, tokenService })
  const googleAuthService = createGoogleAuthService({ ...repositories, clientId: env.googleClientId, recaptchaVerifier, tokenService, transactionManager: database })
  const authController = createAuthController({ authenticationService, googleAuthService, registrationService, validateGooglePayload, validateLoginPayload, validateRegisterPayload, isProduction: env.nodeEnv === 'production' })

  return { router: createAuthRouter({ authController }) }
}

module.exports = { createAuthModule }
