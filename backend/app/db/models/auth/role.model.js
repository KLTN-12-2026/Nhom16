const { DataTypes, Model } = require('sequelize')

class Role extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.STRING(255), allowNull: true },
      },
      {
        tableName: 'roles',
        modelName: 'Role',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    this.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: { name: 'roleId', field: 'role_id' },
      otherKey: { name: 'userId', field: 'user_id' },
      as: 'users',
    })
  }
}

module.exports = Role
