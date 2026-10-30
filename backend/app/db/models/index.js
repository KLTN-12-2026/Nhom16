const { initAuthModel } = require('./auth')
const { initCandidateModel } = require('./candidate')
const { initCategoryModel } = require('./category')
const { initEmployerModel } = require('./employer')
const { initJobModel } = require('./job')
const { initUserModel } = require('./user')

const initializeModels = (sequelize) => {
  const models = {
    ...initUserModel(sequelize),
    ...initAuthModel(sequelize),
    ...initEmployerModel(sequelize),
    ...initCandidateModel(sequelize),
    ...initCategoryModel(sequelize),
    ...initJobModel(sequelize),
  }

  Object.values(models)
    .filter((model) => typeof model.associate === 'function')
    .forEach((model) => model.associate(models))

  return models
}

module.exports = { initializeModels }
