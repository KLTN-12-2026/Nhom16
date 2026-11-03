'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('candidate_profiles')
    if (!tableDefinition.avatar) {
      await queryInterface.addColumn('candidate_profiles', 'avatar', {
        type: Sequelize.STRING(500),
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable('candidate_profiles')
    if (tableDefinition.avatar) {
      await queryInterface.removeColumn('candidate_profiles', 'avatar')
    }
  },
}

