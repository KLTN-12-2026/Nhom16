const { initCandidateController: initCandidateProfileController } = require('./candidate.controller')
const { initCandidateCvController } = require('./candidate-cv.controller')

const initCandidateController = (app, dependencies) => {
  initCandidateProfileController(app, dependencies)
  initCandidateCvController(app, dependencies)
}

module.exports = { initCandidateController }
