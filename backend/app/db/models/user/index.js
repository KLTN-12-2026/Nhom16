const { DataTypes } = require('sequelize')

const { defineUser } = require('./user.model')

const initUserModel = (sequelize) => ({
  User: defineUser(sequelize, DataTypes),
})

module.exports = { initUserModel }
