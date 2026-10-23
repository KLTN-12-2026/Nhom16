const { database } = require('../config/database')
const { initializeModels } = require('./models')

let models

const initDatabase = async () => {
  await database.authenticate()
  models ||= initializeModels(database)
  return { database, models }
}

const closeDatabase = () => database.close()

module.exports = { closeDatabase, initDatabase }
