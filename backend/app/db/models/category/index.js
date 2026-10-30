const JobCategory = require('./job-category.model')

const initCategoryModel = (sequelize) => ({
  JobCategory: JobCategory.init(sequelize),
})

module.exports = { initCategoryModel }
