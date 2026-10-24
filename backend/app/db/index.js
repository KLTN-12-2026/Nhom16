const { database } = require('../config')
const { initializeModels } = require('./models')
const { createAuthRepositories } = require('./repositories')

const db = {
  sequelize: database,
  Sequelize: database.constructor,
}
let models

const initDatabase = async () => {
  await database.authenticate()
  if (!models) {
    models = initializeModels(database)
    Object.assign(db, models)
  }
  return { database, models: db }
}

const closeDatabase = () => database.close()

module.exports = { closeDatabase, createAuthRepositories, db, initDatabase }
