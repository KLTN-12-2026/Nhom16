const { errorHandler, notFound } = require('./error')

const initErrorMiddleware = (app) => {
  app.use(notFound)
  app.use(errorHandler)
}

module.exports = { initErrorMiddleware }
