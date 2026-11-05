const { DataTypes, Model } = require('sequelize')

class ApplicationStatusHistory extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      applicationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'application_id' },
      fromStatus: { type: DataTypes.STRING(20), allowNull: true, field: 'from_status' },
      toStatus: { type: DataTypes.STRING(20), allowNull: false, field: 'to_status' },
      note: { type: DataTypes.STRING(1000), allowNull: true },
      changedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'changed_by_id' },
    }, { tableName: 'application_status_histories', modelName: 'ApplicationStatusHistory', sequelize, ...opts })
  }

  static associate(models) {
    this.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application' })
    this.belongsTo(models.User, { foreignKey: 'changedById', as: 'changedBy' })
  }
}

module.exports = ApplicationStatusHistory
