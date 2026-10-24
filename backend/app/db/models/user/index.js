const User = require('./user.model')

const initUserModel = (sequelize) => ({
  User: User.init(sequelize),
})

module.exports = { initUserModel }
