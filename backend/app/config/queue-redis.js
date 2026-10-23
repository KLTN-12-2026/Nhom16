const Redis = require('ioredis')

const { env } = require('./env')

const createQueueRedis = () => new Redis(env.redis.url, {
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

module.exports = { createQueueRedis }
