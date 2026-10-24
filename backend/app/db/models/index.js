const { initAuthModel } = require('./auth')
const { initEmployerModel } = require('./employer')
const { initUserModel } = require('./user')

const initializeModels = (sequelize) => {
  const models = {
    ...initUserModel(sequelize),
    ...initAuthModel(sequelize),
    ...initEmployerModel(sequelize),
  }

  Object.values(models)
    .filter((model) => typeof model.associate === 'function')
    .forEach((model) => model.associate(models))

  return models
}

module.exports = { initializeModels }
