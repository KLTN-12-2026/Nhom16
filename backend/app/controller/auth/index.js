const { env } = require('../../config')
const { createPassportMiddleware, createRecaptchaMiddleware, createAuthRateLimiters, validateBody } = require('../../middleware')
const { createAuthServices } = require('../../service')
const { createAuthCookieHelper } = require('../../util')
const validators = require('../../validator')
const { createAuthController } = require('./auth.controller')
const { createAuthRouter } = require('./auth.router')

const initAuthController = (app, dependencies) => {
  const services = createAuthServices(dependencies)
  const authCookie = createAuthCookieHelper({ isProduction: env.nodeEnv === 'production' })
  const authController = createAuthController({ authCookie, ...services })
  const authMiddleware = createPassportMiddleware({
    authenticationService: services.authenticationService,
    jwtSecret: env.auth.accessSecret,
  })
  const verifyRecaptcha = createRecaptchaMiddleware({ recaptchaVerifier: services.recaptchaVerifier })
  const rateLimiters = createAuthRateLimiters({
    redis: dependencies.redis,
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
  const router = createAuthRouter({
    authController,
    authMiddleware,
    rateLimiters,
    validateBody,
    verifyRecaptcha,
    validators: {
      googleStart: validators.validateGoogleStartPayload,
      googleComplete: validators.validateGoogleCompletePayload,
      googleResend: validators.validateGoogleResendPayload,
      forgotPassword: validators.validateForgotPasswordPayload,
      login: validators.validateLoginPayload,
      register: validators.validateRegisterPayload,
      resetPassword: validators.validateResetPasswordPayload,
      resendVerification: validators.validateResendVerificationPayload,
      verifyEmail: validators.validateVerifyEmailPayload,
    },
  })

  app.use(authMiddleware.initialize)
  app.use('/api/auth', router)
}

module.exports = { createAuthController, createAuthRouter, initAuthController }
