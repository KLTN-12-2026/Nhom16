const { Queue } = require('bullmq')
const { createQueueRedis, env } = require('../../config')

const CV_QUEUE = 'cv-processing'
const CV_JOBS = Object.freeze({ EXTRACT: 'extract-cv' })

const createCvQueue = () => {
  const connection = createQueueRedis()
  const queue = new Queue(CV_QUEUE, {
    connection,
    prefix: `${env.redis.keyPrefix}bull`,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  })
  return {
    addExtraction: (cvId) => queue.add(CV_JOBS.EXTRACT, { cvId }),
    async close() {
      await queue.close()
      await connection.quit()
    },
  }
}

module.exports = { CV_JOBS, CV_QUEUE, createCvQueue }
