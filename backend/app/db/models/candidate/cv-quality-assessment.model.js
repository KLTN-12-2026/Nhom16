const { DataTypes, Model } = require('sequelize')

class CvQualityAssessment extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidateCvId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_cv_id' },
      analysisVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'analysis_version' },
      overallScore: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, field: 'overall_score' },
      criteria: { type: DataTypes.JSON, allowNull: false },
      strengths: { type: DataTypes.JSON, allowNull: false },
      limitations: { type: DataTypes.JSON, allowNull: false },
      assessedAt: { type: DataTypes.DATE, allowNull: false, field: 'assessed_at' },
    }, {
      tableName: 'cv_quality_assessments',
      modelName: 'CvQualityAssessment',
      sequelize,
      ...opts,
    })
  }

  static associate(models) {
    this.belongsTo(models.CandidateCv, { foreignKey: 'candidateCvId', as: 'cv' })
  }
}

module.exports = CvQualityAssessment
