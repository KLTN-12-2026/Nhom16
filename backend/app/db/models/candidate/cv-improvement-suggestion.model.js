const { DataTypes, Model } = require('sequelize')

class CvImprovementSuggestion extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidateCvId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_cv_id' },
      analysisVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'analysis_version' },
      targetRole: { type: DataTypes.STRING(160), allowNull: false, field: 'target_role' },
      recommendedSkills: { type: DataTypes.JSON, allowNull: false, field: 'recommended_skills' },
      objectiveRewrite: { type: DataTypes.JSON, allowNull: false, field: 'objective_rewrite' },
      experienceRewrites: { type: DataTypes.JSON, allowNull: false, field: 'experience_rewrites' },
      educationSuggestion: { type: DataTypes.JSON, allowNull: true, field: 'education_suggestion' },
      presentationSuggestion: { type: DataTypes.JSON, allowNull: true, field: 'presentation_suggestion' },
      warnings: { type: DataTypes.JSON, allowNull: false },
      generatedAt: { type: DataTypes.DATE, allowNull: false, field: 'generated_at' },
    }, {
      tableName: 'cv_improvement_suggestions',
      modelName: 'CvImprovementSuggestion',
      sequelize,
      ...opts,
    })
  }

  static associate(models) {
    this.belongsTo(models.CandidateCv, { foreignKey: 'candidateCvId', as: 'cv' })
  }
}

module.exports = CvImprovementSuggestion

