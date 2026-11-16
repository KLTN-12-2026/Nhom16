const { createReadiness, health } = require('./health.controller')
const { initNotificationController } = require('./notification.controller')
const { initReportController } = require('./report.controller')

const initCommonController = (app, dependencies) => {
  app.get('/health', health)
  app.get('/ready', createReadiness(dependencies))
  initNotificationController(app)
  initReportController(app)
}

module.exports = { createReadiness, health, initCommonController }
