const createAuthRepositories = ({ AuthIdentity, Role, User, UserRole }) => ({
  userRepository: {
    findByEmail(email, options = {}) {
      return User.findOne({ where: { email }, transaction: options.transaction })
    },
    create(data, options = {}) {
      return User.create(data, { transaction: options.transaction })
    },
    assignRole(userId, roleId, options = {}) {
      return UserRole.create({ userId, roleId }, { transaction: options.transaction })
    },
  },
  roleRepository: {
    findByCode(code, options = {}) {
      return Role.findOne({ where: { code }, transaction: options.transaction })
    },
  },
  identityRepository: {
    create(data, options = {}) {
      return AuthIdentity.create(data, { transaction: options.transaction })
    },
  },
})

module.exports = { createAuthRepositories }
