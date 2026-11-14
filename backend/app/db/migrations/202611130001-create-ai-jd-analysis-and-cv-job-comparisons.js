'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_jd_analyses', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      job_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'jobs', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      analysis_version: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false }, status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'PENDING' },
      title: { type: Sequelize.STRING(220), allowNull: true }, summary: { type: Sequelize.TEXT, allowNull: true }, responsibilities: { type: Sequelize.JSON, allowNull: true },
      required_skills: { type: Sequelize.JSON, allowNull: true }, preferred_skills: { type: Sequelize.JSON, allowNull: true }, experience_requirements: { type: Sequelize.JSON, allowNull: true },
      education_requirements: { type: Sequelize.JSON, allowNull: true }, keywords: { type: Sequelize.JSON, allowNull: true }, mandatory_requirements: { type: Sequelize.JSON, allowNull: true },
      error_message: { type: Sequelize.STRING(500), allowNull: true }, is_confirmed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, confirmed_at: { type: Sequelize.DATE, allowNull: true }, analyzed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }, updated_at: { type: Sequelize.DATE, allowNull: false },
    })
    await queryInterface.addIndex('job_jd_analyses', ['job_id', 'analysis_version'], { unique: true, name: 'job_jd_analyses_job_version_unique' })
    await queryInterface.createTable('cv_job_comparisons', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidate_cv_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'candidate_cvs', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      job_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'jobs', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      job_jd_analysis_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'job_jd_analyses', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      cv_analysis_version: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false }, status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'PENDING' },
      met_criteria: { type: Sequelize.JSON, allowNull: true }, partial_criteria: { type: Sequelize.JSON, allowNull: true }, missing_criteria: { type: Sequelize.JSON, allowNull: true },
      explanation: { type: Sequelize.TEXT, allowNull: true }, error_message: { type: Sequelize.STRING(500), allowNull: true }, compared_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }, updated_at: { type: Sequelize.DATE, allowNull: false },
    })
    await queryInterface.addIndex('cv_job_comparisons', ['candidate_cv_id', 'job_jd_analysis_id', 'cv_analysis_version'], { unique: true, name: 'cv_job_comparisons_source_version_unique' })
  },
  async down(queryInterface) { await queryInterface.dropTable('cv_job_comparisons'); await queryInterface.dropTable('job_jd_analyses') },
}
