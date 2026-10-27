const { initAdminController } = require('./admin')
const { initAuthController } = require('./auth')
const { initCommonController } = require('./common')

const initApiController = (app, dependencies) => {
  initCommonController(app, dependencies)
  initAuthController(app, dependencies)
  initAdminController(app, dependencies)
}

module.exports = { initApiController }
