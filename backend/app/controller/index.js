const { createReadiness, health } = require('./common')
const { createAuthModule } = require('../service/auth')

const initApiController = (app, dependencies) => {
  const { passportInitialize, router: authRouter } = createAuthModule(dependencies)

  app.use(passportInitialize)
  app.get('/health', health)
  app.get('/ready', createReadiness(dependencies))
  app.use('/api/auth', authRouter)
}

module.exports = { initApiController }
