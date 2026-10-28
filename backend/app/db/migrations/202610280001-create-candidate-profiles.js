'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('candidate_profiles', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      address: { type: Sequelize.STRING(500), allowNull: true },
      title: { type: Sequelize.STRING(150), allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      skills: { type: Sequelize.JSON, allowNull: true },
      education: { type: Sequelize.JSON, allowNull: true },
      experience: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('candidate_profiles')
  },
}
