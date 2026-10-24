const { env } = require('../../config')
const { createAuthRepositories } = require('../../db')
const { createAuthCookieHelper } = require('../../util')
const { createAuthenticationService, initUserSignIn, toAuthUser } = require('./authentication.service')
const { createEmailVerificationService } = require('./email-verification.service')
const { createGoogleAuthService } = require('./google-auth.service')
const { createPasswordService } = require('./password.service')
const { createPasswordResetService } = require('./password-reset.service')
const { createRecaptchaVerifier } = require('./recaptcha.service')
const { createRegistrationService } = require('./registration.service')
const { createSessionService } = require('./session.service')
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
  const registrationService = createRegistrationService({
    transactionManager: database,
    ...repositories,
    passwordService,
  })
  const emailVerificationService = createEmailVerificationService({
    ...repositories,
    emailQueue,
    frontendOrigin: env.frontendOrigin,
    transactionManager: database,
  })
  const authenticationService = createAuthenticationService({ ...repositories, passwordService, tokenService })
  const googleAuthService = createGoogleAuthService({
    ...repositories,
    clientId: env.googleClientId,
    emailQueue,
    otpSecret: env.auth.refreshSecret,
    recaptchaVerifier,
    redis,
    transactionManager: database,
  })
  const sessionService = createSessionService({ ...repositories, tokenService, transactionManager: database })
  const passwordResetService = createPasswordResetService({
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
    authCookie: createAuthCookieHelper({ isProduction: env.nodeEnv === 'production' }),
    authenticationService,
    emailVerificationService,
    googleAuthService,
    passwordResetService,
    recaptchaVerifier,
    registrationService,
    sessionService,
    toAuthUser,
  }
}

module.exports = { createAuthServices }
