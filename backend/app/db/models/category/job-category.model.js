const { DataTypes, Model } = require('sequelize')

class JobCategory extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.SMALLINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(180), allowNull: false },
        shortName: { type: DataTypes.STRING(100), allowNull: false, field: 'short_name' },
        legalReference: { type: DataTypes.STRING(255), allowNull: false, field: 'legal_reference' },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      },
      {
        tableName: 'job_categories',
        modelName: 'JobCategory',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    this.hasMany(models.Job, { foreignKey: 'categoryId', as: 'jobs' })
  }
}

module.exports = JobCategory
