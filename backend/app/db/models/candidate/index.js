const CandidateProfile = require('./candidate-profile.model')

const CandidateCv = require('./candidate-cv.model')
const CvImprovementSuggestion = require('./cv-improvement-suggestion.model')
const CvQualityAssessment = require('./cv-quality-assessment.model')

const initCandidateModel = (sequelize) => ({
  CandidateProfile: CandidateProfile.init(sequelize),
  CandidateCv: CandidateCv.init(sequelize),
  CvImprovementSuggestion: CvImprovementSuggestion.init(sequelize),
  CvQualityAssessment: CvQualityAssessment.init(sequelize),
})

module.exports = { initCandidateModel }
