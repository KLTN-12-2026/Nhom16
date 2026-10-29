const { DataTypes, Model } = require('sequelize')

class CandidateCv extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
        displayName: { type: DataTypes.STRING(180), allowNull: false, field: 'display_name' },
        originalName: { type: DataTypes.STRING(255), allowNull: false, field: 'original_name' },
        storedName: { type: DataTypes.STRING(255), allowNull: false, unique: true, field: 'stored_name' },
        storagePath: { type: DataTypes.STRING(700), allowNull: false, field: 'storage_path' },
        mimeType: { type: DataTypes.STRING(150), allowNull: false, field: 'mime_type' },
        sizeBytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'size_bytes' },
        isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' },
      },
      {
        tableName: 'candidate_cvs',
        modelName: 'CandidateCv',
        sequelize,
        ...opts,
      },
    )
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'userId', field: 'user_id' },
      as: 'user',
    })
  }

  toJSON() {
    const values = { ...this.get() }
    delete values.storedName
    delete values.storagePath
    return values
  }
}

module.exports = CandidateCv
