const { initEmployerReviewController } = require('./employer-review.controller')

const initAdminController = (app, dependencies) => {
  initEmployerReviewController(app, dependencies)
}

module.exports = { initAdminController }
