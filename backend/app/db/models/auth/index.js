const { DataTypes } = require('sequelize')

const { defineAuthIdentity } = require('./auth-identity.model')
const { defineAuthSession } = require('./auth-session.model')
const { defineEmailVerificationToken } = require('./email-verification-token.model')
const { definePasswordResetToken } = require('./password-reset-token.model')
const { defineRole } = require('./role.model')
const { defineUserRole } = require('./user-role.model')

const initAuthModel = (sequelize) => ({
  AuthIdentity: defineAuthIdentity(sequelize, DataTypes),
  AuthSession: defineAuthSession(sequelize, DataTypes),
  EmailVerificationToken: defineEmailVerificationToken(sequelize, DataTypes),
  PasswordResetToken: definePasswordResetToken(sequelize, DataTypes),
  Role: defineRole(sequelize, DataTypes),
  UserRole: defineUserRole(sequelize, DataTypes),
})

module.exports = { initAuthModel }
