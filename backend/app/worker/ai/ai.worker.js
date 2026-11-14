const { Worker } = require('bullmq')
const { createQueueRedis, env } = require('../../config')
const { AI_JOBS, AI_QUEUE } = require('../../queue')
const { processJdAnalysis } = require('../../service/employer/jd-analysis.service')
const { processCvJobComparison } = require('../../service/candidate/cv-job-comparison.service')
const createAiWorker = () => {
  const connection = createQueueRedis()
  const worker = new Worker(AI_QUEUE, job => {
    if (job.name === AI_JOBS.ANALYZE_JD) return processJdAnalysis(job.data)
    if (job.name === AI_JOBS.COMPARE_CV_JOB) return processCvJobComparison(job.data)
    throw new Error(`Unsupported AI job: ${job.name}`)
  }, { connection, prefix: `${env.redis.keyPrefix}bull`, concurrency: 1 })
  worker.on('failed', (job, error) => console.error(`AI job ${job?.id} (${job?.name}) failed:`, error.message))
  return { connection, worker }
}
module.exports = { createAiWorker }
