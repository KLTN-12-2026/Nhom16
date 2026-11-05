const { DataTypes, Model } = require('sequelize')

class Application extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      jobId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'job_id' },
      candidateId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_id' },
      candidateCvId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_cv_id' },
      coverLetter: { type: DataTypes.TEXT, allowNull: true, field: 'cover_letter' },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'RECEIVED' },
      appliedAt: { type: DataTypes.DATE, allowNull: false, field: 'applied_at' },
    }, { tableName: 'applications', modelName: 'Application', sequelize, ...opts })
  }

  static associate(models) {
    this.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' })
    this.belongsTo(models.User, { foreignKey: 'candidateId', as: 'candidate' })
    this.belongsTo(models.CandidateCv, { foreignKey: 'candidateCvId', as: 'cv' })
    this.hasMany(models.ApplicationStatusHistory, { foreignKey: 'applicationId', as: 'history' })
  }
}

module.exports = Application
