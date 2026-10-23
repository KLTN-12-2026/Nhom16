const { createApp } = require('./app')
const { redis } = require('./config/redis')
const { initApiController } = require('./controller')
const { closeDatabase, initDatabase } = require('./db')
const { initErrorMiddleware } = require('./middleware')
const { initQueue } = require('./queue')

const initRedis = async () => {
  if (redis.status === 'wait') await redis.connect()
  return redis
}

const initApplication = async () => {
  const [{ database, models }, redisClient] = await Promise.all([
    initDatabase(),
    initRedis(),
  ])
  const queue = initQueue()
  const dependencies = {
    database,
    emailQueue: queue.emailQueue,
    models,
    redis: redisClient,
  }

  const app = createApp()
  initApiController(app, dependencies)
  initErrorMiddleware(app)

  return {
    app,
    async close() {
      await Promise.allSettled([
        closeDatabase(),
        queue.close(),
        redisClient.quit(),
      ])
    },
  }
}

module.exports = { initApplication }
