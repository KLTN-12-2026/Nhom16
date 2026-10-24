const { env } = require('../../config')
const { initAuthRateLimiters } = require('../rate-limit')
const { initPassportMiddleware } = require('./passport.middleware')
const { initRecaptchaMiddleware } = require('./recaptcha.middleware')

const createAuthMiddleware = ({ authenticationService, recaptchaVerifier, redis }) => {
  const authMiddleware = initPassportMiddleware({
    authenticationService,
    jwtSecret: env.auth.accessSecret,
  })
  const rateLimiters = initAuthRateLimiters({
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
  const verifyRecaptcha = initRecaptchaMiddleware({ recaptchaVerifier })

  return {
    authMiddleware,
    rateLimiters,
    verifyRecaptcha,
  }
}

module.exports = { createAuthMiddleware }
