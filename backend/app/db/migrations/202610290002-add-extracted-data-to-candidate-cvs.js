'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('candidate_cvs', 'candidate_name', { type: Sequelize.STRING(180), allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'candidate_email', { type: Sequelize.STRING(254), allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'candidate_phone', { type: Sequelize.STRING(30), allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'headline', { type: Sequelize.STRING(255), allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'avatar_path', { type: Sequelize.STRING(700), allowNull: true })
    await queryInterface.addColumn('candidate_cvs', 'extraction_status', {
      type: Sequelize.ENUM('completed', 'partial', 'failed'),
      allowNull: false,
      defaultValue: 'partial',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('candidate_cvs', 'extraction_status')
    await queryInterface.removeColumn('candidate_cvs', 'avatar_path')
    await queryInterface.removeColumn('candidate_cvs', 'headline')
    await queryInterface.removeColumn('candidate_cvs', 'candidate_phone')
    await queryInterface.removeColumn('candidate_cvs', 'candidate_email')
    await queryInterface.removeColumn('candidate_cvs', 'candidate_name')
  },
}
