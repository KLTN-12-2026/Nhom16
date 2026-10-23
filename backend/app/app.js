const crypto = require('node:crypto')

const cors = require('cors')
const express = require('express')
const helmet = require('helmet')

const { env } = require('./config/env')
const { createReadiness, health } = require('./controller/common')
const { errorHandler, notFound } = require('./middleware/error')

const createApp = ({ database, redis, authRouter, passportInitialize } = {}) => {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.frontendOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  if (passportInitialize) app.use(passportInitialize)
  app.use((request, response, next) => {
    request.id = request.headers['x-request-id'] || crypto.randomUUID()
    response.setHeader('x-request-id', request.id)
    next()
  })

  app.get('/health', health)
  app.get('/ready', createReadiness({ database, redis }))
  if (authRouter) app.use('/api/auth', authRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
