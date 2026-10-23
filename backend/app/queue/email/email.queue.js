const { Queue } = require('bullmq')

const { env } = require('../../config/env')
const { createQueueRedis } = require('../../config/queue-redis')

const EMAIL_QUEUE = 'email'
const EMAIL_JOBS = Object.freeze({
  PASSWORD_RESET: 'password-reset',
  GOOGLE_WELCOME: 'google-welcome',
})

const createEmailQueue = () => {
  const connection = createQueueRedis()
  const queue = new Queue(EMAIL_QUEUE, {
    connection,
    prefix: `${env.redis.keyPrefix}bull`,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  })

  return {
    add(name, data, options = {}) {
      return queue.add(name, data, options)
    },
    async close() {
      await queue.close()
      await connection.quit()
    },
  }
}

module.exports = { EMAIL_JOBS, EMAIL_QUEUE, createEmailQueue }
