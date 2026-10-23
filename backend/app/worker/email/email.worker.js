const { Worker } = require('bullmq')

const { createQueueRedis, env } = require('../../config')
const { EMAIL_JOBS, EMAIL_QUEUE } = require('../../queue')
const { createEmailService } = require('../../service')
const { createEmailVerificationEmail, createGoogleOtpEmail, createGoogleWelcomeEmail, createPasswordResetEmail } = require('../../template')

const createEmailWorker = () => {
  const connection = createQueueRedis()
  const emailService = createEmailService(env.mail)
  const worker = new Worker(EMAIL_QUEUE, async (job) => {
    if (job.name === EMAIL_JOBS.EMAIL_VERIFICATION) {
      return emailService.send({ to: job.data.email, ...createEmailVerificationEmail(job.data) })
    }
    if (job.name === EMAIL_JOBS.PASSWORD_RESET) {
      return emailService.send({ to: job.data.email, ...createPasswordResetEmail(job.data) })
    }
    if (job.name === EMAIL_JOBS.GOOGLE_WELCOME) {
      return emailService.send({ to: job.data.email, ...createGoogleWelcomeEmail(job.data) })
    }
    if (job.name === EMAIL_JOBS.GOOGLE_OTP) {
      return emailService.send({ to: job.data.email, ...createGoogleOtpEmail(job.data) })
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
