const express = require('express')

const { createAuthMiddleware } = require('../../middleware')
const { createAuthServices } = require('../../service')
const { authValidators } = require('../../validator')
const { initAuthEmailController } = require('./auth.controller')

const initAuthController = (app, dependencies) => {
  const services = createAuthServices(dependencies)
  const middleware = createAuthMiddleware({
    authenticationService: services.authenticationService,
    recaptchaVerifier: services.recaptchaVerifier,
    redis: dependencies.redis,
  })
  const authEmail = express.Router()
  initAuthEmailController(authEmail, {
    ...services,
    ...middleware,
    validators: authValidators,
  })

  app.use(middleware.authMiddleware.initialize)
  app.use('/api/auth', authEmail)
}

module.exports = { initAuthController, initAuthEmailController }
