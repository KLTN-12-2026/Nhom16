const { env } = require('./env')

const createConfig = (databaseName) => ({
  username: env.database.user,
  password: env.database.password,
  database: databaseName,
  host: env.database.host,
  port: env.database.port,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: false,
})

module.exports = {
  development: createConfig(env.database.name),
  test: createConfig(process.env.DB_NAME || 'tuyen_dung_ai_test'),
  production: createConfig(env.database.name),
}
