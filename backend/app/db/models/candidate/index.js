const CandidateProfile = require('./candidate-profile.model')

const initCandidateModel = (sequelize) => ({
  CandidateProfile: CandidateProfile.init(sequelize),
})

module.exports = { initCandidateModel }
