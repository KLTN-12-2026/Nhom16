const { DataTypes, Model } = require('sequelize')

class Notification extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
      type: { type: DataTypes.STRING(50), allowNull: false }, title: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.STRING(1000), allowNull: false }, entityType: { type: DataTypes.STRING(50), allowNull: true, field: 'entity_type' },
      entityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'entity_id' }, readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
    }, { tableName: 'notifications', modelName: 'Notification', sequelize, ...opts })
  }
  static associate(models) { this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' }) }
}

module.exports = Notification
