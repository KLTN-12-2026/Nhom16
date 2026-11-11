'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('candidate_cvs', 'education', { type: Sequelize.JSON, allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'experience', { type: Sequelize.JSON, allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'analysis_version', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    })
    await queryInterface.addColumn('candidate_cvs', 'analysis_error', { type: Sequelize.STRING(500), allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'analyzed_at', { type: Sequelize.DATE, allowNull: true })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('candidate_cvs', 'analyzed_at')
    await queryInterface.removeColumn('candidate_cvs', 'analysis_error')
    await queryInterface.removeColumn('candidate_cvs', 'analysis_version')
    await queryInterface.removeColumn('candidate_cvs', 'experience')
    await queryInterface.removeColumn('candidate_cvs', 'education')
  },
}
