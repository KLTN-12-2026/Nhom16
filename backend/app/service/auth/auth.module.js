const { env } = require('../../config')
const { createAuthRepositories } = require('../../db')
const { createAuthenticationService, initUserSignIn } = require('./authentication.service')
const { initEmailVerificationService } = require('./email-verification.service')
const { initGoogleAuthService } = require('./google-auth.service')
const { createPasswordService } = require('./password.service')
const { initPasswordResetService } = require('./password-reset.service')
const { createRecaptchaVerifier } = require('./recaptcha.service')
const { initRegistrationService } = require('./registration.service')
const { initSessionService } = require('./session.service')
const { createTokenService } = require('./token.service')

const createAuthServices = ({ database, emailQueue, models, redis }) => {
  const repositories = createAuthRepositories(models)
  const recaptchaVerifier = createRecaptchaVerifier({
    secretKey: env.recaptcha.secretKey,
    minimumScore: env.recaptcha.minimumScore,
    allowedHostnames: ['localhost', '127.0.0.1'],
  })
  const passwordService = createPasswordService()
  const tokenService = createTokenService({
    accessSecret: env.auth.accessSecret,
    accessExpiresIn: env.auth.accessTokenExpiresIn,
    refreshSecret: env.auth.refreshSecret,
    refreshExpiresIn: env.auth.refreshTokenExpiresIn,
  })
  initRegistrationService({
    transactionManager: database,
    ...repositories,
    passwordService,
  })
  initEmailVerificationService({
    ...repositories,
    emailQueue,
    frontendOrigin: env.frontendOrigin,
    transactionManager: database,
  })
  const authenticationService = createAuthenticationService({ ...repositories, passwordService, tokenService })
  initGoogleAuthService({
    ...repositories,
    clientId: env.googleClientId,
    emailQueue,
    otpSecret: env.auth.refreshSecret,
    recaptchaVerifier,
    redis,
    transactionManager: database,
  })
  const sessionService = initSessionService({ ...repositories, tokenService, transactionManager: database })
  initPasswordResetService({
    ...repositories,
    emailQueue,
    frontendOrigin: env.frontendOrigin,
    passwordService,
    transactionManager: database,
  })
  initUserSignIn({
    passwordService,
    recaptchaVerifier,
    sessionService,
  })
  return {
    authenticationService,
    recaptchaVerifier,
  }
}

module.exports = { createAuthServices }
