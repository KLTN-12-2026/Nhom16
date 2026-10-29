'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('employer_profiles', 'logo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'company_name',
    })
    await queryInterface.addColumn('employer_profiles', 'company_size', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'company_website',
    })
    await queryInterface.addColumn('employer_profiles', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'company_size',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('employer_profiles', 'logo')
    await queryInterface.removeColumn('employer_profiles', 'company_size')
    await queryInterface.removeColumn('employer_profiles', 'description')
  },
}
