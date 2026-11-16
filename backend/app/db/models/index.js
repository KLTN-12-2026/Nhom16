const { initAuthModel } = require('./auth')
const { initCandidateModel } = require('./candidate')
const { initAdminModel } = require('./admin')
const { initCategoryModel } = require('./category')
const { initEmployerModel } = require('./employer')
const { initJobModel } = require('./job')
const { initRecruitmentModel } = require('./recruitment')
const { initUserModel } = require('./user')

const initializeModels = (sequelize) => {
  const models = {
    ...initAdminModel(sequelize),
    ...initUserModel(sequelize),
    ...initAuthModel(sequelize),
    ...initEmployerModel(sequelize),
    ...initCandidateModel(sequelize),
    ...initCategoryModel(sequelize),
    ...initJobModel(sequelize),
    ...initRecruitmentModel(sequelize),
  }

  Object.values(models)
    .filter((model) => typeof model.associate === 'function')
    .forEach((model) => model.associate(models))

  return models
}

module.exports = { initializeModels }
