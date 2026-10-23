const { env } = require('../../config')
const { createAuthRateLimiters } = require('../rate-limit')
const { validateBody } = require('../validation')
const { createPassportMiddleware } = require('./passport.middleware')
const { createRecaptchaMiddleware } = require('./recaptcha.middleware')

const createAuthMiddleware = ({ authenticationService, recaptchaVerifier, redis }) => {
  const authMiddleware = createPassportMiddleware({
    authenticationService,
    jwtSecret: env.auth.accessSecret,
  })
  const rateLimiters = createAuthRateLimiters({
    redis,
    config: {
      loginWindowMs: env.auth.loginRateLimitWindowMs,
      loginMax: env.auth.loginRateLimitMax,
      refreshWindowMs: env.auth.refreshRateLimitWindowMs,
      refreshMax: env.auth.refreshRateLimitMax,
      forgotPasswordWindowMs: env.auth.forgotPasswordRateLimitWindowMs,
      forgotPasswordMax: env.auth.forgotPasswordRateLimitMax,
      emailVerificationWindowMs: env.auth.emailVerificationRateLimitWindowMs,
      emailVerificationMax: env.auth.emailVerificationRateLimitMax,
    },
  })

  return {
    authMiddleware,
    rateLimiters,
    validateBody,
    verifyRecaptcha: createRecaptchaMiddleware({ recaptchaVerifier }),
  }
}

module.exports = { createAuthMiddleware }
