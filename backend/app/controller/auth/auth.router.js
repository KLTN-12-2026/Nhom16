const express = require('express')

const createAuthRouter = ({ authController }) => {
  const router = express.Router()
  router.post('/register', authController.register)
  router.post('/login', authController.login)
  router.post('/google', authController.google)
  router.get('/me', authController.me)
  router.post('/logout', authController.logout)
  return router
}

module.exports = { createAuthRouter }
