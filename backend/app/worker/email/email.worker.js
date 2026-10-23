const { Worker } = require('bullmq')

const { env } = require('../../config/env')
const { createQueueRedis } = require('../../config/queue-redis')
const { EMAIL_JOBS, EMAIL_QUEUE } = require('../../queue')
const { createEmailService } = require('../../service/notification')
const { createGoogleWelcomeEmail, createPasswordResetEmail } = require('../../template/email')

const createEmailWorker = () => {
  const connection = createQueueRedis()
  const emailService = createEmailService(env.mail)
  const worker = new Worker(EMAIL_QUEUE, async (job) => {
    if (job.name === EMAIL_JOBS.PASSWORD_RESET) {
      return emailService.send({ to: job.data.email, ...createPasswordResetEmail(job.data) })
    }
    if (job.name === EMAIL_JOBS.GOOGLE_WELCOME) {
      return emailService.send({ to: job.data.email, ...createGoogleWelcomeEmail(job.data) })
    }
    throw new Error(`Unsupported email job: ${job.name}`)
  }, {
    connection,
    concurrency: 5,
    prefix: `${env.redis.keyPrefix}bull`,
  })

  worker.on('failed', (job, error) => console.error(`Email job ${job?.id} failed:`, error.message))
  return { worker, connection }
}

module.exports = { createEmailWorker }
