'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employer_profiles', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      company_name: { type: Sequelize.STRING(200), allowNull: false },
      tax_code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      business_license_number: { type: Sequelize.STRING(50), allowNull: false },
      company_phone: { type: Sequelize.STRING(20), allowNull: false },
      company_address: { type: Sequelize.STRING(500), allowNull: false },
      company_website: { type: Sequelize.STRING(255), allowNull: true },
      representative_name: { type: Sequelize.STRING(150), allowNull: false },
      representative_position: { type: Sequelize.STRING(100), allowNull: false },
      verification_status: {
        type: Sequelize.ENUM('PENDING_REVIEW', 'VERIFIED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING_REVIEW',
      },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employer_profiles')
  },
}
