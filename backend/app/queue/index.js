const { createEmailQueue, EMAIL_JOBS, EMAIL_QUEUE } = require('./email')

const initQueue = () => {
  const emailQueue = createEmailQueue()
  return {
    emailQueue,
    close: () => emailQueue.close(),
  }
}

module.exports = { EMAIL_JOBS, EMAIL_QUEUE, createEmailQueue, initQueue }
