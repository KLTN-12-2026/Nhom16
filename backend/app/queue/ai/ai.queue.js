const { Queue } = require('bullmq')
const { createQueueRedis, env } = require('../../config')
const AI_QUEUE = 'ai-recruitment'
const AI_JOBS = Object.freeze({ ANALYZE_JD: 'analyze-jd', COMPARE_CV_JOB: 'compare-cv-job' })
const createAiQueue = () => {
  const connection = createQueueRedis()
  const queue = new Queue(AI_QUEUE, { connection, prefix: `${env.redis.keyPrefix}bull`, defaultJobOptions: { attempts: 1, removeOnComplete: 500, removeOnFail: 1000 } })
  const addFreshJob = async (name, data, jobId) => {
    const existing = await queue.getJob(jobId)
    if (existing && ['completed', 'failed'].includes(await existing.getState())) await existing.remove()
    return queue.add(name, data, { jobId })
  }
  return {
    addJdAnalysis: data => addFreshJob(AI_JOBS.ANALYZE_JD, data, `jd-analysis-${data.analysisId}`),
    addCvJobComparison: data => addFreshJob(AI_JOBS.COMPARE_CV_JOB, data, `cv-job-comparison-${data.comparisonId}`),
    async close() { await queue.close(); await connection.quit() },
  }
}
module.exports = { AI_JOBS, AI_QUEUE, createAiQueue }
