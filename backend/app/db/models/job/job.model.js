const { DataTypes, Model } = require('sequelize')

class Job extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        categoryId: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'category_id' },
        employerProfileId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'employer_profile_id' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'created_by_id' },
        sourceKey: { type: DataTypes.STRING(80), allowNull: true, unique: true, field: 'source_key' },
        title: { type: DataTypes.STRING(220), allowNull: false },
        company: { type: DataTypes.STRING(220), allowNull: false },
        companyLogo: { type: DataTypes.STRING(8), allowNull: false, field: 'company_logo' },
        logoColor: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'blue', field: 'logo_color' },
        salaryMin: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'salary_min' },
        salaryMax: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'salary_max' },
        location: { type: DataTypes.STRING(120), allowNull: false },
        workMode: { type: DataTypes.STRING(30), allowNull: false, field: 'work_mode' },
        experienceLevel: { type: DataTypes.STRING(30), allowNull: false, field: 'experience_level' },
        employmentType: { type: DataTypes.STRING(30), allowNull: false, field: 'employment_type' },
        positionLevel: { type: DataTypes.STRING(30), allowNull: false, field: 'position_level' },
        description: { type: DataTypes.TEXT('long'), allowNull: false },
        requirements: { type: DataTypes.JSON, allowNull: false },
        benefits: { type: DataTypes.JSON, allowNull: false },
        skills: { type: DataTypes.JSON, allowNull: false },
        deadline: { type: DataTypes.DATEONLY, allowNull: false },
        publishedAt: { type: DataTypes.DATE, allowNull: false, field: 'published_at' },
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
        isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_public' },
        isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_hidden' },
        closedAt: { type: DataTypes.DATE, allowNull: true, field: 'closed_at' },
      },
      {
        tableName: 'jobs',
        modelName: 'Job',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    this.belongsTo(models.JobCategory, { foreignKey: 'categoryId', as: 'category' })
    this.belongsTo(models.EmployerProfile, { foreignKey: 'employerProfileId', as: 'employerProfile' })
    this.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' })
    this.hasMany(models.JobJdFile, { foreignKey: 'jobId', as: 'jdFiles' })
    this.hasMany(models.Application, { foreignKey: 'jobId', as: 'applications' })
  }
}

module.exports = Job
