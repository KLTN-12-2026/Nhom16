const { Worker } = require('bullmq')

const { createQueueRedis, env } = require('../../config')
const { CV_JOBS, CV_QUEUE } = require('../../queue')
const { processCandidateCv } = require('../../service/candidate/candidate-cv.service')
const { processCandidateCvImprovement } = require('../../service/candidate/cv-improvement-suggestion.service')

const createCvWorker = () => {
  const connection = createQueueRedis()
  const worker = new Worker(CV_QUEUE, (job) => {
    if (job.name === CV_JOBS.EXTRACT) return processCandidateCv(job.data.cvId)
    if (job.name === CV_JOBS.IMPROVE) return processCandidateCvImprovement(job.data)
    throw new Error(`Unsupported CV job: ${job.name}`)
  }, {
    connection,
    prefix: `${env.redis.keyPrefix}bull`,
    concurrency: 3,
  })
  worker.on('failed', (job, error) => console.error(`CV job ${job?.id} (${job?.name}) failed:`, error.message))
  return { connection, worker }
}

module.exports = { createCvWorker }
