const { DataTypes } = require('sequelize')

const { defineAuthIdentity, defineAuthSession, definePasswordResetToken, defineRole, defineUserRole } = require('./auth')
const { defineUser } = require('./user')
const { defineEmployerProfile } = require('./employer')

const initializeModels = (sequelize) => {
  const User = defineUser(sequelize, DataTypes)
  const Role = defineRole(sequelize, DataTypes)
  const UserRole = defineUserRole(sequelize, DataTypes)
  const AuthIdentity = defineAuthIdentity(sequelize, DataTypes)
  const AuthSession = defineAuthSession(sequelize, DataTypes)
  const PasswordResetToken = definePasswordResetToken(sequelize, DataTypes)
  const EmployerProfile = defineEmployerProfile(sequelize, DataTypes)

  const userForeignKey = { name: 'userId', field: 'user_id' }
  const roleForeignKey = { name: 'roleId', field: 'role_id' }

  User.belongsToMany(Role, { through: UserRole, foreignKey: userForeignKey, otherKey: roleForeignKey, as: 'roles' })
  Role.belongsToMany(User, { through: UserRole, foreignKey: roleForeignKey, otherKey: userForeignKey, as: 'users' })
  User.hasMany(AuthIdentity, { foreignKey: userForeignKey, as: 'identities' })
  AuthIdentity.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasMany(AuthSession, { foreignKey: userForeignKey, as: 'sessions' })
  AuthSession.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasMany(PasswordResetToken, { foreignKey: userForeignKey, as: 'passwordResetTokens' })
  PasswordResetToken.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })
  User.hasOne(EmployerProfile, { foreignKey: userForeignKey, as: 'employerProfile' })
  EmployerProfile.belongsTo(User, { foreignKey: userForeignKey, as: 'user' })

  return { AuthIdentity, AuthSession, EmployerProfile, PasswordResetToken, Role, User, UserRole }
}

module.exports = { initializeModels }
