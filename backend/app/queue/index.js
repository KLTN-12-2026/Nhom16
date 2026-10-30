const { createEmailQueue, EMAIL_JOBS, EMAIL_QUEUE } = require('./email')
const { createCvQueue, CV_JOBS, CV_QUEUE } = require('./cv')

const initQueue = () => {
  const emailQueue = createEmailQueue()
  const cvQueue = createCvQueue()
  return {
    cvQueue,
    emailQueue,
    close: () => Promise.all([emailQueue.close(), cvQueue.close()]),
  }
}

module.exports = { CV_JOBS, CV_QUEUE, EMAIL_JOBS, EMAIL_QUEUE, createCvQueue, createEmailQueue, initQueue }
