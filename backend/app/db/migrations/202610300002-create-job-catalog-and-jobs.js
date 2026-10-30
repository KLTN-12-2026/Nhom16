'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_categories', {
      id: { type: Sequelize.SMALLINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(10), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(180), allowNull: false },
      short_name: { type: Sequelize.STRING(100), allowNull: false },
      legal_reference: { type: Sequelize.STRING(255), allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })

    await queryInterface.createTable('jobs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      category_id: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
        references: { model: 'job_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      source_key: { type: Sequelize.STRING(80), allowNull: true, unique: true },
      title: { type: Sequelize.STRING(220), allowNull: false },
      company: { type: Sequelize.STRING(220), allowNull: false },
      company_logo: { type: Sequelize.STRING(8), allowNull: false },
      logo_color: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'blue' },
      salary_min: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      salary_max: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      location: { type: Sequelize.STRING(120), allowNull: false },
      work_mode: { type: Sequelize.STRING(30), allowNull: false },
      experience_level: { type: Sequelize.STRING(30), allowNull: false },
      employment_type: { type: Sequelize.STRING(30), allowNull: false },
      position_level: { type: Sequelize.STRING(30), allowNull: false },
      description: { type: Sequelize.TEXT('long'), allowNull: false },
      requirements: { type: Sequelize.JSON, allowNull: false },
      benefits: { type: Sequelize.JSON, allowNull: false },
      skills: { type: Sequelize.JSON, allowNull: false },
      deadline: { type: Sequelize.DATEONLY, allowNull: false },
      published_at: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_hidden: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    })

    await queryInterface.addIndex('jobs', ['status', 'is_public', 'is_hidden', 'deadline'], { name: 'jobs_visibility_idx' })
    await queryInterface.addIndex('jobs', ['category_id', 'location'], { name: 'jobs_category_location_idx' })
    await queryInterface.addIndex('jobs', ['published_at'], { name: 'jobs_published_idx' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jobs')
    await queryInterface.dropTable('job_categories')
  },
}
