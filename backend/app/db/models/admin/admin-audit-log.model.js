const { DataTypes, Model } = require('sequelize')
class AdminAuditLog extends Model {
  static init(sequelize, opts = {}) { return super.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, adminId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'admin_id' }, action: { type: DataTypes.STRING(80), allowNull: false }, entityType: { type: DataTypes.STRING(50), allowNull: false, field: 'entity_type' }, entityId: { type: DataTypes.BIGINT.UNSIGNED, field: 'entity_id' }, reason: DataTypes.STRING(1000), metadata: DataTypes.JSON }, { tableName: 'admin_audit_logs', modelName: 'AdminAuditLog', sequelize, ...opts }) }
  static associate(models) { this.belongsTo(models.User, { foreignKey: 'adminId', as: 'admin' }) }
}
module.exports = AdminAuditLog
