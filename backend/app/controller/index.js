const { initAuthController } = require('./auth')
const { initCommonController } = require('./common')

const initApiController = (app, dependencies) => {
  initCommonController(app, dependencies)
  initAuthController(app, dependencies)
}

module.exports = { initApiController }
