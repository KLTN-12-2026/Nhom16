const createAuthRepositories = ({ AuthIdentity, Role, User, UserRole }) => ({
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
  },
  roleRepository: {
    findByCode(code, options = {}) {
      return Role.findOne({ where: { code }, transaction: options.transaction })
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
})

module.exports = { createAuthRepositories }
