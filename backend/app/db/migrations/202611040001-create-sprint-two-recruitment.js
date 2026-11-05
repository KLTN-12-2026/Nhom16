'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jobs', 'employer_profile_id', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'employer_profiles', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    await queryInterface.addColumn('jobs', 'created_by_id', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    await queryInterface.addColumn('jobs', 'closed_at', { type: Sequelize.DATE, allowNull: true })
    await queryInterface.addIndex('jobs', ['employer_profile_id', 'status', 'deadline'], { name: 'jobs_employer_status_deadline_idx' })

    await queryInterface.createTable('job_jd_files', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      job_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'jobs', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      uploaded_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      stored_name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      storage_path: { type: Sequelize.STRING(700), allowNull: false },
      mime_type: { type: Sequelize.STRING(150), allowNull: false },
      size_bytes: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })

    await queryInterface.createTable('applications', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      job_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'jobs', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      candidate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      candidate_cv_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'candidate_cvs', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      cover_letter: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'RECEIVED' },
      applied_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addConstraint('applications', { fields: ['job_id', 'candidate_id'], type: 'unique', name: 'applications_job_candidate_unique' })
    await queryInterface.addIndex('applications', ['job_id', 'status', 'applied_at'], { name: 'applications_job_status_applied_idx' })

    await queryInterface.createTable('application_status_histories', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      application_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'applications', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      from_status: { type: Sequelize.STRING(20), allowNull: true },
      to_status: { type: Sequelize.STRING(20), allowNull: false },
      note: { type: Sequelize.STRING(1000), allowNull: true },
      changed_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })

    await queryInterface.createTable('favorite_jobs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      candidate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      job_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'jobs', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addConstraint('favorite_jobs', { fields: ['candidate_id', 'job_id'], type: 'unique', name: 'favorite_jobs_candidate_job_unique' })

    await queryInterface.createTable('favorite_candidates', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      employer_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      candidate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addConstraint('favorite_candidates', { fields: ['employer_id', 'candidate_id'], type: 'unique', name: 'favorite_candidates_employer_candidate_unique' })

    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      type: { type: Sequelize.STRING(50), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.STRING(1000), allowNull: false },
      entity_type: { type: Sequelize.STRING(50), allowNull: true },
      entity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })
    await queryInterface.addIndex('notifications', ['user_id', 'read_at', 'created_at'], { name: 'notifications_user_read_created_idx' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications')
    await queryInterface.dropTable('favorite_candidates')
    await queryInterface.dropTable('favorite_jobs')
    await queryInterface.dropTable('application_status_histories')
    await queryInterface.dropTable('applications')
    await queryInterface.dropTable('job_jd_files')
    await queryInterface.removeIndex('jobs', 'jobs_employer_status_deadline_idx')
    await queryInterface.removeColumn('jobs', 'closed_at')
    await queryInterface.removeColumn('jobs', 'created_by_id')
    await queryInterface.removeColumn('jobs', 'employer_profile_id')
  },
}
