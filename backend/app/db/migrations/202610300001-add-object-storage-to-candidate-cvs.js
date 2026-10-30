'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('candidate_cvs', 'storage_provider', {
      type: Sequelize.STRING(20), allowNull: false, defaultValue: 'local', after: 'storage_path',
    })
    await queryInterface.addColumn('candidate_cvs', 'object_etag', {
      type: Sequelize.STRING(255), allowNull: true, after: 'storage_provider',
    })
    await queryInterface.changeColumn('candidate_cvs', 'extraction_status', {
      type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('candidate_cvs', 'extraction_status', {
      type: Sequelize.ENUM('completed', 'partial', 'failed'), allowNull: false, defaultValue: 'partial',
    })
    await queryInterface.removeColumn('candidate_cvs', 'object_etag')
    await queryInterface.removeColumn('candidate_cvs', 'storage_provider')
  },
}
