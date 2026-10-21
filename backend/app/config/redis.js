const Redis = require('ioredis')

const { env } = require('./env')

const redis = new Redis(env.redis.url, {
  keyPrefix: env.redis.keyPrefix,
  lazyConnect: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
})

redis.on('error', (error) => {
  if (env.nodeEnv !== 'test') {
    console.error('Redis connection error:', error.message)
  }
})

module.exports = { redis }
