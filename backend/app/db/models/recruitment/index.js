const Application = require('./application.model')
const ApplicationStatusHistory = require('./application-status-history.model')
const JobJdFile = require('./job-jd-file.model')
const { FavoriteCandidate, FavoriteJob } = require('./favorite.model')
const Notification = require('./notification.model')

const initRecruitmentModel = (sequelize) => ({
  Application: Application.init(sequelize),
  ApplicationStatusHistory: ApplicationStatusHistory.init(sequelize),
  JobJdFile: JobJdFile.init(sequelize),
  FavoriteJob: FavoriteJob.init(sequelize),
  FavoriteCandidate: FavoriteCandidate.init(sequelize),
  Notification: Notification.init(sequelize),
})

module.exports = { initRecruitmentModel }
