const { Queue } = require('bullmq')

const { createQueueRedis, env } = require('../../config')

const EMAIL_QUEUE = 'email'
const EMAIL_JOBS = Object.freeze({
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  GOOGLE_WELCOME: 'google-welcome',
  GOOGLE_OTP: 'google-otp',
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
