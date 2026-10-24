const { DataTypes, Model } = require('sequelize')

class EmailVerificationToken extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
        tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'token_hash' },
        expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
        usedAt: { type: DataTypes.DATE, allowNull: true, field: 'used_at' },
      },
      {
        tableName: 'email_verification_tokens',
        modelName: 'EmailVerificationToken',
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
  }
}

module.exports = EmailVerificationToken
