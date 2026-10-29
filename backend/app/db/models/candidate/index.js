const CandidateProfile = require('./candidate-profile.model')

const CandidateCv = require('./candidate-cv.model')

const initCandidateModel = (sequelize) => ({
  CandidateProfile: CandidateProfile.init(sequelize),
  CandidateCv: CandidateCv.init(sequelize),
})

module.exports = { initCandidateModel }
