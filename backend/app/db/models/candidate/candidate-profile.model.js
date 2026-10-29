const { DataTypes, Model } = require('sequelize')

class CandidateProfile extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true, field: 'user_id' },
        phone: { type: DataTypes.STRING(20), allowNull: true },
        address: { type: DataTypes.STRING(500), allowNull: true },
        title: { type: DataTypes.STRING(150), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        skills: { type: DataTypes.JSON, allowNull: true },
        education: { type: DataTypes.JSON, allowNull: true },
        experience: { type: DataTypes.JSON, allowNull: true },
      },
      {
        tableName: 'candidate_profiles',
        modelName: 'CandidateProfile',
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
}

module.exports = CandidateProfile
