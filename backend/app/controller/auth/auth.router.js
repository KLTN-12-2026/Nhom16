const express = require('express')

const { asyncHandler } = require('../../util/async-handler')

const createAuthRouter = ({ authController, authMiddleware, rateLimiters, validateBody, validators, verifyRecaptcha }) => {
  const router = express.Router()

  router.post(
    '/register',
    validateBody(validators.register),
    verifyRecaptcha('register'),
    asyncHandler(authController.register),
  )
  router.post(
    '/login',
    rateLimiters.login,
    validateBody(validators.login),
    verifyRecaptcha('login'),
    authMiddleware.authenticateLocal,
    asyncHandler(authController.login),
  )
  router.post(
    '/verify-email',
    validateBody(validators.verifyEmail),
    asyncHandler(authController.verifyEmail),
  )
  router.post(
    '/resend-verification',
    rateLimiters.emailVerification,
    validateBody(validators.resendVerification),
    asyncHandler(authController.resendVerification),
  )
  router.post(
    '/google',
    validateBody(validators.google),
    asyncHandler(authController.google),
  )
  router.post('/refresh', rateLimiters.refresh, asyncHandler(authController.refresh))
  router.post(
    '/forgot-password',
    rateLimiters.forgotPassword,
    validateBody(validators.forgotPassword),
    asyncHandler(authController.forgotPassword),
  )
  router.post(
    '/reset-password',
    validateBody(validators.resetPassword),
    asyncHandler(authController.resetPassword),
  )
  router.get(
    '/me',
    authMiddleware.authenticateJwt,
    asyncHandler(authController.me),
  )
  router.post('/logout', asyncHandler(authController.logout))

  return router
}

module.exports = { createAuthRouter }
