const crypto = require('node:crypto')

const cors = require('cors')
const express = require('express')
const helmet = require('helmet')

const { env } = require('./config')
const createApp = () => {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.frontendOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use((request, response, next) => {
    request.id = request.headers['x-request-id'] || crypto.randomUUID()
    response.setHeader('x-request-id', request.id)
    next()
  })

  return app
}

module.exports = { createApp }
