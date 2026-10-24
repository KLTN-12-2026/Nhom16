const EmployerProfile = require('./employer-profile.model')

const initEmployerModel = (sequelize) => ({
  EmployerProfile: EmployerProfile.init(sequelize),
})

module.exports = { initEmployerModel }
