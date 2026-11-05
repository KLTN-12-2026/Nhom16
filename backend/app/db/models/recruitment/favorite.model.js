const { DataTypes, Model } = require('sequelize')

class FavoriteJob extends Model {
  static init(sequelize, opts = {}) {
    return super.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, candidateId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_id' }, jobId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'job_id' } }, { tableName: 'favorite_jobs', modelName: 'FavoriteJob', sequelize, ...opts })
  }
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'candidateId', as: 'candidate' })
    this.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' })
  }
}

class FavoriteCandidate extends Model {
  static init(sequelize, opts = {}) {
    return super.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, employerId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'employer_id' }, candidateId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'candidate_id' } }, { tableName: 'favorite_candidates', modelName: 'FavoriteCandidate', sequelize, ...opts })
  }
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'employerId', as: 'employer' })
    this.belongsTo(models.User, { foreignKey: 'candidateId', as: 'candidate' })
  }
}

module.exports = { FavoriteCandidate, FavoriteJob }
