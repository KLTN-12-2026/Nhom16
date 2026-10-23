const { env } = require('../../config/env')
const { createAuthController, createAuthRouter } = require('../../controller/auth')
const { initializeModels } = require('../../db/models')
const { createAuthRepositories } = require('../../db/repositories')
const { createPassportMiddleware, createRecaptchaMiddleware } = require('../../middleware/auth')
const { createAuthRateLimiters } = require('../../middleware/rate-limit')
const { validateBody } = require('../../middleware/validation')
const { createAuthCookieHelper } = require('../../util/auth-cookie.helper')
const { validateGooglePayload, validateLoginPayload, validateRegisterPayload } = require('../../validator/auth')
const { createAuthenticationService } = require('./authentication.service')
const { createGoogleAuthService } = require('./google-auth.service')
const { createPasswordService } = require('./password.service')
const { createRecaptchaVerifier } = require('./recaptcha.service')
const { createRegistrationService } = require('./registration.service')
const { createTokenService } = require('./token.service')

const createAuthModule = ({ database, redis }) => {
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
  })
  const authenticationService = createAuthenticationService({ ...repositories, passwordService, tokenService })
  const googleAuthService = createGoogleAuthService({ ...repositories, clientId: env.googleClientId, recaptchaVerifier, tokenService, transactionManager: database })
  const authCookie = createAuthCookieHelper({ isProduction: env.nodeEnv === 'production' })
  const authController = createAuthController({ authenticationService, authCookie, googleAuthService, registrationService })
  const authMiddleware = createPassportMiddleware({ authenticationService, jwtSecret: env.auth.accessSecret })
  const verifyRecaptcha = createRecaptchaMiddleware({ recaptchaVerifier })
  const rateLimiters = createAuthRateLimiters({
    redis,
    config: {
      loginWindowMs: env.auth.loginRateLimitWindowMs,
      loginMax: env.auth.loginRateLimitMax,
      refreshWindowMs: env.auth.refreshRateLimitWindowMs,
      refreshMax: env.auth.refreshRateLimitMax,
    },
  })

  return {
    passportInitialize: authMiddleware.initialize,
    router: createAuthRouter({
      authController,
      authMiddleware,
      rateLimiters,
      validateBody,
      verifyRecaptcha,
      validators: {
        google: validateGooglePayload,
        login: validateLoginPayload,
        register: validateRegisterPayload,
      },
    }),
  }
}

module.exports = { createAuthModule }
