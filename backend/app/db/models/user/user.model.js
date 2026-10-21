const defineUser = (sequelize, DataTypes) =>
  sequelize.define(
    'User',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: true, field: 'password_hash' },
      fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
      status: {
        type: DataTypes.ENUM('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DISABLED'),
        allowNull: false,
        defaultValue: 'PENDING_VERIFICATION',
      },
      emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verified_at' },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
    },
    { tableName: 'users' },
  )

module.exports = { defineUser }
