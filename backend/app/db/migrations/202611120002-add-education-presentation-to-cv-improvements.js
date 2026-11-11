'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cv_improvement_suggestions', 'education_suggestion', {
      type: Sequelize.JSON,
      allowNull: true,
    })
    await queryInterface.addColumn('cv_improvement_suggestions', 'presentation_suggestion', {
      type: Sequelize.JSON,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cv_improvement_suggestions', 'presentation_suggestion')
    await queryInterface.removeColumn('cv_improvement_suggestions', 'education_suggestion')
  },
}

