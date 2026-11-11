'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cv_quality_assessments', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidate_cv_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'candidate_cvs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      analysis_version: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      overall_score: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      criteria: { type: Sequelize.JSON, allowNull: false },
      strengths: { type: Sequelize.JSON, allowNull: false },
      limitations: { type: Sequelize.JSON, allowNull: false },
      assessed_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })
    await queryInterface.addIndex('cv_quality_assessments', ['candidate_cv_id', 'analysis_version'], {
      name: 'cv_quality_assessments_cv_version_unique',
      unique: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cv_quality_assessments')
  },
}
