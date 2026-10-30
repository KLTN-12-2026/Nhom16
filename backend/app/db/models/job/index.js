const Job = require('./job.model')

const initJobModel = (sequelize) => ({
  Job: Job.init(sequelize),
})

module.exports = { initJobModel }
