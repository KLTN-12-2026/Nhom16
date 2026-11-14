const CandidateProfile = require('./candidate-profile.model')

const CandidateCv = require('./candidate-cv.model')
const CvImprovementSuggestion = require('./cv-improvement-suggestion.model')
const CvQualityAssessment = require('./cv-quality-assessment.model')
const CvJobComparison = require('./cv-job-comparison.model')

const initCandidateModel = (sequelize) => ({
  CandidateProfile: CandidateProfile.init(sequelize),
  CandidateCv: CandidateCv.init(sequelize),
  CvImprovementSuggestion: CvImprovementSuggestion.init(sequelize),
  CvQualityAssessment: CvQualityAssessment.init(sequelize),
  CvJobComparison: CvJobComparison.init(sequelize),
})

module.exports = { initCandidateModel }
