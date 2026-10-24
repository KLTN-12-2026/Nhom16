const { Sequelize } = require('sequelize')
const mysql2 = require('mysql2')

const { env } = require('./env')

const database = new Sequelize(env.database.name, env.database.user, env.database.password, {
  host: env.database.host,
  port: env.database.port,
  dialect: 'mysql',
  dialectModule: mysql2,
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: env.database.poolMax,
    min: env.database.poolMin,
    acquire: env.database.poolAcquireMs,
    idle: env.database.poolIdleMs,
    evict: env.database.poolEvictMs,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
  timezone: '+00:00',
})

module.exports = { database }
