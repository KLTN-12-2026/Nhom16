const express = require('express')

const { createAuthMiddleware } = require('../../middleware')
const { initializePassport } = require('../../middleware/auth/passport.middleware')
const { createAuthServices } = require('../../service')
const { initAuthEmailController } = require('./auth.controller')

const initAuthController = (app, dependencies) => {
  const services = createAuthServices(dependencies)
  createAuthMiddleware({
    authenticationService: services.authenticationService,
    recaptchaVerifier: services.recaptchaVerifier,
    redis: dependencies.redis,
  })
  const authEmail = express.Router()
  initAuthEmailController(authEmail)

  app.use(initializePassport)
  app.use('/api/auth', authEmail)
}

module.exports = { initAuthController, initAuthEmailController }
