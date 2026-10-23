'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_verification_tokens', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token_hash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addIndex('email_verification_tokens', ['user_id', 'expires_at'], {
      name: 'email_verification_tokens_user_expiry_idx',
    })
  },
  async down(queryInterface) {
    await queryInterface.dropTable('email_verification_tokens')
  },
}
