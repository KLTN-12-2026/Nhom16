const { Op } = require('sequelize')

const createAuthRepositories = ({ AuthIdentity, AuthSession, EmailVerificationToken, EmployerProfile, PasswordResetToken, Role, User, UserRole }) => ({
  userRepository: {
    findByEmail(email, options = {}) {
      return User.findOne({ where: { email }, transaction: options.transaction })
    },
    findByIdWithRoles(id, options = {}) {
      return User.findByPk(id, {
        include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
        transaction: options.transaction,
      })
    },
    findByEmailWithRoles(email, options = {}) {
      return User.findOne({
        where: { email },
        include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
        transaction: options.transaction,
      })
    },
    create(data, options = {}) {
      return User.create(data, { transaction: options.transaction })
    },
    assignRole(userId, roleId, options = {}) {
      return UserRole.create({ userId, roleId }, { transaction: options.transaction })
    },
    updateLastLogin(userId, options = {}) {
      return User.update({ lastLoginAt: new Date() }, { where: { id: userId }, transaction: options.transaction })
    },
    updatePassword(userId, passwordHash, options = {}) {
      return User.update({ passwordHash }, { where: { id: userId }, transaction: options.transaction })
    },
    markEmailVerified(userId, options = {}) {
      return User.update(
        { emailVerifiedAt: new Date(), status: 'ACTIVE' },
        { where: { id: userId, status: 'PENDING_VERIFICATION' }, transaction: options.transaction },
      )
    },
  },
  roleRepository: {
    findById(id, options = {}) {
      return Role.findByPk(id, { transaction: options.transaction })
    },
  },
  employerProfileRepository: {
    findByTaxCode(taxCode, options = {}) {
      return EmployerProfile.findOne({ where: { taxCode }, transaction: options.transaction })
    },
    create(data, options = {}) {
      return EmployerProfile.create(data, { transaction: options.transaction })
    },
  },
  identityRepository: {
    findByProviderSubject(provider, providerSubject, options = {}) {
      return AuthIdentity.findOne({ where: { provider, providerSubject }, transaction: options.transaction })
    },
    create(data, options = {}) {
      return AuthIdentity.create(data, { transaction: options.transaction })
    },
  },
  sessionRepository: {
    create(data, options = {}) {
      return AuthSession.create(data, { transaction: options.transaction })
    },
    findByIdForUpdate(id, options = {}) {
      return AuthSession.findByPk(id, {
        transaction: options.transaction,
        lock: options.transaction?.LOCK?.UPDATE,
      })
    },
    revoke(id, replacedBySessionId = null, options = {}) {
      return AuthSession.update(
        { revokedAt: new Date(), replacedBySessionId },
        { where: { id }, transaction: options.transaction },
      )
    },
    revokeAllByUser(userId, options = {}) {
      return AuthSession.update(
        { revokedAt: new Date() },
        { where: { userId, revokedAt: null }, transaction: options.transaction },
      )
    },
  },
  passwordResetRepository: {
    create(data, options = {}) {
      return PasswordResetToken.create(data, { transaction: options.transaction })
    },
    findActiveByHash(tokenHash, options = {}) {
      return PasswordResetToken.findOne({
        where: { tokenHash, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
        transaction: options.transaction,
        lock: options.transaction?.LOCK?.UPDATE,
      })
    },
    invalidateByUser(userId, options = {}) {
      return PasswordResetToken.update(
        { usedAt: new Date() },
        { where: { userId, usedAt: null }, transaction: options.transaction },
      )
    },
  },
  emailVerificationRepository: {
    create(data, options = {}) {
      return EmailVerificationToken.create(data, { transaction: options.transaction })
    },
    findActiveByHash(tokenHash, options = {}) {
      return EmailVerificationToken.findOne({
        where: { tokenHash, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
        transaction: options.transaction,
        lock: options.transaction?.LOCK?.UPDATE,
      })
    },
    invalidateByUser(userId, options = {}) {
      return EmailVerificationToken.update(
        { usedAt: new Date() },
        { where: { userId, usedAt: null }, transaction: options.transaction },
      )
    },
  },
})

module.exports = { createAuthRepositories }
