const { database } = require('../config')
const { initializeModels } = require('./models')
const { createAuthRepositories } = require('./repositories')

let models

const initDatabase = async () => {
  await database.authenticate()
  models ||= initializeModels(database)
  return { database, models }
}

const closeDatabase = () => database.close()

module.exports = { closeDatabase, createAuthRepositories, initDatabase }
