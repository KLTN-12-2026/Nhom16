const { initEmployerReviewController } = require('./employer-review.controller')
const { initAdminController: initAdminUserController } = require('./admin.controller')

const initAdminController = (app, dependencies) => {
  initEmployerReviewController(app, dependencies)
  initAdminUserController(app, dependencies)
}

module.exports = { initAdminController }
