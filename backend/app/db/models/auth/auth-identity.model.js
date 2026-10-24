const { DataTypes, Model } = require('sequelize')

class AuthIdentity extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
        provider: { type: DataTypes.ENUM('LOCAL', 'GOOGLE'), allowNull: false },
        providerSubject: { type: DataTypes.STRING(191), allowNull: false, field: 'provider_subject' },
        emailSnapshot: { type: DataTypes.STRING(191), allowNull: false, field: 'email_snapshot' },
      },
      {
        tableName: 'auth_identities',
        modelName: 'AuthIdentity',
        indexes: [{ unique: true, fields: ['provider', 'provider_subject'] }],
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

module.exports = AuthIdentity
