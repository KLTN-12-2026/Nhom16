'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('candidate_cvs', 'skills', {
      type: Sequelize.JSON,
      allowNull: true,
    })
    await queryInterface.addColumn('candidate_cvs', 'certificates', {
      type: Sequelize.JSON,
      allowNull: true,
    })
    await queryInterface.addColumn('candidate_cvs', 'projects', {
      type: Sequelize.JSON,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('candidate_cvs', 'projects')
    await queryInterface.removeColumn('candidate_cvs', 'certificates')
    await queryInterface.removeColumn('candidate_cvs', 'skills')
  },
}
