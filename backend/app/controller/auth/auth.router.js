const express = require('express')

const createAuthRouter = ({ authController }) => {
  const router = express.Router()
  router.post('/register', authController.register)
  return router
}

module.exports = { createAuthRouter }
