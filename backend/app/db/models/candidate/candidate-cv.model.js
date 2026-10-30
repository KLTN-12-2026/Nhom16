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
        candidateName: { type: DataTypes.STRING(180), allowNull: true, field: 'candidate_name' },
        candidateEmail: { type: DataTypes.STRING(254), allowNull: true, field: 'candidate_email' },
        candidatePhone: { type: DataTypes.STRING(30), allowNull: true, field: 'candidate_phone' },
        headline: { type: DataTypes.STRING(255), allowNull: true },
        avatarPath: { type: DataTypes.STRING(700), allowNull: true, field: 'avatar_path' },
        extractionStatus: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'pending',
          field: 'extraction_status',
        },
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
    delete values.avatarPath
    return values
  }
}

module.exports = CandidateCv
