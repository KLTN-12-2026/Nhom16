'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_audit_logs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      admin_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      action: { type: Sequelize.STRING(80), allowNull: false }, entity_type: { type: Sequelize.STRING(50), allowNull: false }, entity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      reason: { type: Sequelize.STRING(1000), allowNull: true }, metadata: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }, updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addIndex('admin_audit_logs', ['entity_type', 'entity_id', 'created_at'], { name: 'admin_audit_entity_idx' })
    await queryInterface.createTable('admin_catalog_items', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, type: { type: Sequelize.STRING(30), allowNull: false },
      name: { type: Sequelize.STRING(180), allowNull: false }, active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }, updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addConstraint('admin_catalog_items', { fields: ['type', 'name'], type: 'unique', name: 'admin_catalog_type_name_unique' })
    await queryInterface.createTable('user_reports', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, reporter_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      report_type: { type: Sequelize.STRING(40), allowNull: false }, content: { type: Sequelize.TEXT, allowNull: false }, entity_type: { type: Sequelize.STRING(50), allowNull: true }, entity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'RECEIVED' }, resolution: { type: Sequelize.TEXT, allowNull: true }, action_taken: { type: Sequelize.STRING(1000), allowNull: true },
      handled_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' }, handled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }, updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addIndex('user_reports', ['status', 'report_type', 'created_at'], { name: 'user_reports_filter_idx' })
  },
  async down(queryInterface) { await queryInterface.dropTable('user_reports'); await queryInterface.dropTable('admin_catalog_items'); await queryInterface.dropTable('admin_audit_logs') },
}
