'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('candidate_cvs', 'extraction_status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('candidate_cvs', 'extraction_status', {
      type: Sequelize.ENUM('completed', 'partial', 'failed'),
      allowNull: false,
      defaultValue: 'partial',
    })
  },
}
