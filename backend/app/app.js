const crypto = require('node:crypto')

const cors = require('cors')
const express = require('express')
const helmet = require('helmet')

const { env } = require('./config')

const isOriginAllowed = (origin) => {
  if (!origin) return true
  if (origin === env.frontendOrigin) return true
  if (process.env.NODE_ENV !== 'production') {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true
    }
  }
  return false
}

const createApp = () => {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, origin || true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use((request, response, next) => {
    request.id = request.headers['x-request-id'] || crypto.randomUUID()
    response.setHeader('x-request-id', request.id)
    next()
  })

  return app
}

module.exports = { createApp }
