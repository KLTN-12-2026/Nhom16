'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cv_improvement_suggestions', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidate_cv_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'candidate_cvs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      analysis_version: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      target_role: { type: Sequelize.STRING(160), allowNull: false },
      recommended_skills: { type: Sequelize.JSON, allowNull: false },
      objective_rewrite: { type: Sequelize.JSON, allowNull: false },
      experience_rewrites: { type: Sequelize.JSON, allowNull: false },
      warnings: { type: Sequelize.JSON, allowNull: false },
      generated_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })
    await queryInterface.addIndex('cv_improvement_suggestions', ['candidate_cv_id', 'analysis_version'], {
      name: 'cv_improvement_suggestions_cv_version_unique',
      unique: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cv_improvement_suggestions')
  },
}

