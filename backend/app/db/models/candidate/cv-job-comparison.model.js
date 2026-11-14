const { DataTypes, Model } = require('sequelize')
class CvJobComparison extends Model {
  static init(sequelize, opts = {}) { return super.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, candidateCvId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_cv_id' },
    jobId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'job_id' }, jobJdAnalysisId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'job_jd_analysis_id' },
    cvAnalysisVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'cv_analysis_version' }, status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
    metCriteria: { type: DataTypes.JSON, allowNull: true, field: 'met_criteria' }, partialCriteria: { type: DataTypes.JSON, allowNull: true, field: 'partial_criteria' }, missingCriteria: { type: DataTypes.JSON, allowNull: true, field: 'missing_criteria' },
    explanation: { type: DataTypes.TEXT, allowNull: true }, errorMessage: { type: DataTypes.STRING(500), allowNull: true, field: 'error_message' }, comparedAt: { type: DataTypes.DATE, allowNull: true, field: 'compared_at' },
  }, { tableName: 'cv_job_comparisons', modelName: 'CvJobComparison', sequelize, ...opts }) }
  static associate(models) { this.belongsTo(models.CandidateCv, { foreignKey: 'candidateCvId', as: 'cv' }); this.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' }); this.belongsTo(models.JobJdAnalysis, { foreignKey: 'jobJdAnalysisId', as: 'jdAnalysis' }) }
}
module.exports = CvJobComparison
