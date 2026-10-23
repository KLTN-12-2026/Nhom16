const { createReadiness, health } = require('./health.controller')

const initCommonController = (app, dependencies) => {
  app.get('/health', health)
  app.get('/ready', createReadiness(dependencies))
}

module.exports = { createReadiness, health, initCommonController }
