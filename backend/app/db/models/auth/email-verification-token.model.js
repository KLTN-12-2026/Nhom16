const defineEmailVerificationToken = (sequelize, DataTypes) =>
  sequelize.define(
    'EmailVerificationToken',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'token_hash' },
      expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
      usedAt: { type: DataTypes.DATE, allowNull: true, field: 'used_at' },
    },
    { tableName: 'email_verification_tokens' },
  )

module.exports = { defineEmailVerificationToken }
