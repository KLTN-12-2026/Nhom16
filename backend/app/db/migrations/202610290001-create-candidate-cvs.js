'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('candidate_cvs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      display_name: { type: Sequelize.STRING(180), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      stored_name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      storage_path: { type: Sequelize.STRING(700), allowNull: false },
      mime_type: { type: Sequelize.STRING(150), allowNull: false },
      size_bytes: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })

    await queryInterface.addIndex('candidate_cvs', ['user_id', 'created_at'], {
      name: 'candidate_cvs_user_created_idx',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('candidate_cvs')
  },
}
