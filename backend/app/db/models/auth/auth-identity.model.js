const defineAuthIdentity = (sequelize, DataTypes) =>
  sequelize.define(
    'AuthIdentity',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
      provider: { type: DataTypes.ENUM('LOCAL', 'GOOGLE'), allowNull: false },
      providerSubject: { type: DataTypes.STRING(191), allowNull: false, field: 'provider_subject' },
      emailSnapshot: { type: DataTypes.STRING(191), allowNull: false, field: 'email_snapshot' },
    },
    {
      tableName: 'auth_identities',
      indexes: [{ unique: true, fields: ['provider', 'provider_subject'] }],
    },
  )

module.exports = { defineAuthIdentity }
