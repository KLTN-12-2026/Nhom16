const { DataTypes, Model } = require('sequelize')
class UserReport extends Model {
  static init(sequelize, opts = {}) { return super.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, reporterId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'reporter_id' }, reportType: { type: DataTypes.STRING(40), allowNull: false, field: 'report_type' }, content: { type: DataTypes.TEXT, allowNull: false }, entityType: { type: DataTypes.STRING(50), field: 'entity_type' }, entityId: { type: DataTypes.BIGINT.UNSIGNED, field: 'entity_id' }, status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'RECEIVED' }, resolution: DataTypes.TEXT, actionTaken: { type: DataTypes.STRING(1000), field: 'action_taken' }, handledById: { type: DataTypes.BIGINT.UNSIGNED, field: 'handled_by_id' }, handledAt: { type: DataTypes.DATE, field: 'handled_at' } }, { tableName: 'user_reports', modelName: 'UserReport', sequelize, ...opts }) }
  static associate(models) { this.belongsTo(models.User, { foreignKey: 'reporterId', as: 'reporter' }); this.belongsTo(models.User, { foreignKey: 'handledById', as: 'handledBy' }) }
}
module.exports = UserReport
