const defineUserRole = (sequelize, DataTypes) =>
  sequelize.define(
    'UserRole',
    {
      userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true, field: 'user_id' },
      roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, field: 'role_id' },
    },
    { tableName: 'user_roles' },
  )

module.exports = { defineUserRole }
