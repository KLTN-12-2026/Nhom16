const { DataTypes, Model } = require('sequelize')

class UserRole extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true, field: 'user_id' },
        roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, field: 'role_id' },
      },
      {
        tableName: 'user_roles',
        modelName: 'UserRole',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'userId', field: 'user_id' },
      as: 'user',
    })
    this.belongsTo(models.Role, {
      foreignKey: { name: 'roleId', field: 'role_id' },
      as: 'role',
    })
  }
}

module.exports = UserRole
