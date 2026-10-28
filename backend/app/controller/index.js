const { initAuthController } = require('./auth')
const { initCommonController } = require('./common')
const { initCandidateController } = require('./candidate')
const { initEmployerController } = require('./employer')
const { initAdminController } = require('./admin')
const { initJobController } = require('./job')

const initApiController = (app, dependencies) => {
  initCommonController(app, dependencies)
  initAuthController(app, dependencies)
  initCandidateController(app, dependencies)
  initEmployerController(app, dependencies)
  initAdminController(app, dependencies)
  initJobController(app, dependencies)
}

module.exports = { initApiController }
