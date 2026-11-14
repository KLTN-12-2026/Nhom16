const Job = require('./job.model')
const JobJdAnalysis = require('./job-jd-analysis.model')

const initJobModel = (sequelize) => ({
  Job: Job.init(sequelize),
  JobJdAnalysis: JobJdAnalysis.init(sequelize),
})

module.exports = { initJobModel }
