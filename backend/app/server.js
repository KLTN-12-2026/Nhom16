const { createApp } = require('./app')
const { database } = require('./config/database')
const { env } = require('./config/env')
const { redis } = require('./config/redis')
const { createAuthModule } = require('./service/auth')

const startServer = async () => {
  await database.authenticate()
  await redis.connect()

  const { passportInitialize, router: authRouter } = createAuthModule({ database })
  const app = createApp({ database, redis, authRouter, passportInitialize })
  const server = app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`)
  })

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`)
    server.close(async () => {
      await Promise.allSettled([database.close(), redis.quit()])
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

startServer().catch((error) => {
  console.error('Unable to start API:', error)
  process.exit(1)
})
