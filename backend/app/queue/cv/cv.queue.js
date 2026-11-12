const { Queue } = require('bullmq')

const { createQueueRedis, env } = require('../../config')

const CV_QUEUE = 'cv-processing'
const CV_JOBS = Object.freeze({
  EXTRACT: 'extract-cv',
  IMPROVE: 'improve-cv',
})

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
    addExtraction(cvId) {
      return queue.add(CV_JOBS.EXTRACT, { cvId })
    },
    addImprovement(payload) {
      return queue.add(CV_JOBS.IMPROVE, payload, { attempts: 1 })
    },
    getJob(jobId) {
      return queue.getJob(String(jobId))
    },
    async close() {
      await queue.close()
      await connection.quit()
    },
  }
}

module.exports = { CV_JOBS, CV_QUEUE, createCvQueue }
