const { DataTypes, Model } = require('sequelize')

class JobJdFile extends Model {
  static init(sequelize, opts = {}) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      jobId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'job_id' },
      uploadedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'uploaded_by_id' },
      originalName: { type: DataTypes.STRING(255), allowNull: false, field: 'original_name' },
      storedName: { type: DataTypes.STRING(255), allowNull: false, field: 'stored_name' },
      storagePath: { type: DataTypes.STRING(700), allowNull: false, field: 'storage_path' },
      mimeType: { type: DataTypes.STRING(150), allowNull: false, field: 'mime_type' },
      sizeBytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'size_bytes' },
    }, { tableName: 'job_jd_files', modelName: 'JobJdFile', sequelize, ...opts })
  }

  static associate(models) {
    this.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' })
    this.belongsTo(models.User, { foreignKey: 'uploadedById', as: 'uploadedBy' })
  }

  toJSON() {
    const values = { ...this.get() }
    delete values.storedName
    delete values.storagePath
    return values
  }
}

module.exports = JobJdFile
