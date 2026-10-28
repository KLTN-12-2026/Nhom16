const { DataTypes, Model } = require('sequelize')

class User extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
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
      {
        tableName: 'users',
        modelName: 'User',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    const userForeignKey = { name: 'userId', field: 'user_id' }

    this.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: userForeignKey,
      otherKey: { name: 'roleId', field: 'role_id' },
      as: 'roles',
    })
    this.hasMany(models.AuthIdentity, { foreignKey: userForeignKey, as: 'identities' })
    this.hasMany(models.AuthSession, { foreignKey: userForeignKey, as: 'sessions' })
    this.hasMany(models.EmailVerificationToken, { foreignKey: userForeignKey, as: 'emailVerificationTokens' })
    this.hasMany(models.PasswordResetToken, { foreignKey: userForeignKey, as: 'passwordResetTokens' })
    this.hasOne(models.EmployerProfile, { foreignKey: userForeignKey, as: 'employerProfile' })
    this.hasOne(models.CandidateProfile, { foreignKey: userForeignKey, as: 'candidateProfile' })
  }

  toJSON() {
    const values = { ...this.get() }
    delete values.passwordHash
    return values
  }
}

module.exports = User
