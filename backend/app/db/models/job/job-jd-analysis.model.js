const { DataTypes, Model } = require('sequelize')

class JobJdAnalysis extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      jobId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'job_id' },
      analysisVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'analysis_version' },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
      title: { type: DataTypes.STRING(220), allowNull: true }, summary: { type: DataTypes.TEXT, allowNull: true },
      responsibilities: { type: DataTypes.JSON, allowNull: true }, requiredSkills: { type: DataTypes.JSON, allowNull: true, field: 'required_skills' },
      preferredSkills: { type: DataTypes.JSON, allowNull: true, field: 'preferred_skills' }, experienceRequirements: { type: DataTypes.JSON, allowNull: true, field: 'experience_requirements' },
      educationRequirements: { type: DataTypes.JSON, allowNull: true, field: 'education_requirements' }, keywords: { type: DataTypes.JSON, allowNull: true },
      mandatoryRequirements: { type: DataTypes.JSON, allowNull: true, field: 'mandatory_requirements' }, errorMessage: { type: DataTypes.STRING(500), allowNull: true, field: 'error_message' },
      isConfirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_confirmed' }, confirmedAt: { type: DataTypes.DATE, allowNull: true, field: 'confirmed_at' }, analyzedAt: { type: DataTypes.DATE, allowNull: true, field: 'analyzed_at' },
    }, { tableName: 'job_jd_analyses', modelName: 'JobJdAnalysis', sequelize, ...opts })
  }
  static associate(models) { this.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' }); this.hasMany(models.CvJobComparison, { foreignKey: 'jobJdAnalysisId', as: 'comparisons' }) }
}
module.exports = JobJdAnalysis
