const { DataTypes } = require('sequelize')

const { defineEmployerProfile } = require('./employer-profile.model')

const initEmployerModel = (sequelize) => ({
  EmployerProfile: defineEmployerProfile(sequelize, DataTypes),
})

module.exports = { initEmployerModel }
