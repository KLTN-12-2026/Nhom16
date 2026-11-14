const { createEmailQueue, EMAIL_JOBS, EMAIL_QUEUE } = require('./email')
const { createCvQueue, CV_JOBS, CV_QUEUE } = require('./cv')
const { createAiQueue, AI_JOBS, AI_QUEUE } = require('./ai')

const initQueue = () => {
  const emailQueue = createEmailQueue()
  const cvQueue = createCvQueue()
  const aiQueue = createAiQueue()
  return {
    cvQueue,
    aiQueue,
    emailQueue,
    close: () => Promise.all([emailQueue.close(), cvQueue.close(), aiQueue.close()]),
  }
}

module.exports = { AI_JOBS, AI_QUEUE, CV_JOBS, CV_QUEUE, EMAIL_JOBS, EMAIL_QUEUE, createAiQueue, createCvQueue, createEmailQueue, initQueue }
