const auth = require('./auth')
const { errorHandler, notFound } = require('./error')
const rateLimit = require('./rate-limit')
const validation = require('./validation')

const initErrorMiddleware = (app) => {
  app.use(notFound)
  app.use(errorHandler)
}

module.exports = { ...auth, ...rateLimit, ...validation, initErrorMiddleware }
