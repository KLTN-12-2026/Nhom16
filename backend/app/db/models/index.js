const { initAuthModel } = require('./auth')
const { initEmployerModel } = require('./employer')
const { initUserModel } = require('./user')

const initializeModels = (sequelize) => {
  const models = {
    ...initUserModel(sequelize),
    ...initAuthModel(sequelize),
    ...initEmployerModel(sequelize),
  }

  const {
    AuthIdentity,
    AuthSession,
    EmailVerificationToken,
    EmployerProfile,
    PasswordResetToken,
    Role,
    User,
    UserRole,
  } = models

  const userForeignKey = { name: 'userId', field: 'user_id' }
  const roleForeignKey = { name: 'roleId', field: 'role_id' }

  User.belongsToMany(Role, { through: UserRole, foreignKey: userForeignKey, otherKey: roleForeignKey, as: 'roles' })
  Role.belongsToMany(User, { through: UserRole, foreignKey: roleForeignKey, otherKey: userForeignKey, as: 'users' })
  User.hasMany(AuthIdentity, { foreignKey: userForeignKey, as: 'identities' })
  AuthIdentity.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasMany(AuthSession, { foreignKey: userForeignKey, as: 'sessions' })
  AuthSession.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasMany(EmailVerificationToken, { foreignKey: userForeignKey, as: 'emailVerificationTokens' })
  EmailVerificationToken.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasMany(PasswordResetToken, { foreignKey: userForeignKey, as: 'passwordResetTokens' })
  PasswordResetToken.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasOne(EmployerProfile, { foreignKey: userForeignKey, as: 'employerProfile' })
  EmployerProfile.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })

  return models
}

module.exports = { initializeModels }
