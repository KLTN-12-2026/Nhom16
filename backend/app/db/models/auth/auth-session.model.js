const { DataTypes, Model } = require('sequelize')

class AuthSession extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
        refreshTokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'refresh_token_hash' },
        expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
        revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
        replacedBySessionId: { type: DataTypes.UUID, allowNull: true, field: 'replaced_by_session_id' },
        ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
        userAgent: { type: DataTypes.STRING(500), allowNull: true, field: 'user_agent' },
      },
      {
        tableName: 'auth_sessions',
        modelName: 'AuthSession',
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

module.exports = AuthSession
