const AuthIdentity = require('./auth-identity.model')
const AuthSession = require('./auth-session.model')
const EmailVerificationToken = require('./email-verification-token.model')
const PasswordResetToken = require('./password-reset-token.model')
const Role = require('./role.model')
const UserRole = require('./user-role.model')

const initAuthModel = (sequelize) => ({
  AuthIdentity: AuthIdentity.init(sequelize),
  AuthSession: AuthSession.init(sequelize),
  EmailVerificationToken: EmailVerificationToken.init(sequelize),
  PasswordResetToken: PasswordResetToken.init(sequelize),
  Role: Role.init(sequelize),
  UserRole: UserRole.init(sequelize),
})

module.exports = { initAuthModel }
