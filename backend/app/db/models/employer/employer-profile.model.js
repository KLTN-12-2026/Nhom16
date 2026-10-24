const { DataTypes, Model } = require('sequelize')

class EmployerProfile extends Model {
  static init(sequelize, opts = {}) {
    return super.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true, field: 'user_id' },
        companyName: { type: DataTypes.STRING(200), allowNull: false, field: 'company_name' },
        taxCode: { type: DataTypes.STRING(30), allowNull: false, unique: true, field: 'tax_code' },
        businessLicenseNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'business_license_number' },
        companyPhone: { type: DataTypes.STRING(20), allowNull: false, field: 'company_phone' },
        companyAddress: { type: DataTypes.STRING(500), allowNull: false, field: 'company_address' },
        companyWebsite: { type: DataTypes.STRING(255), allowNull: true, field: 'company_website' },
        representativeName: { type: DataTypes.STRING(150), allowNull: false, field: 'representative_name' },
        representativePosition: { type: DataTypes.STRING(100), allowNull: false, field: 'representative_position' },
        verificationStatus: {
          type: DataTypes.ENUM('PENDING_REVIEW', 'VERIFIED', 'REJECTED'),
          allowNull: false,
          defaultValue: 'PENDING_REVIEW',
          field: 'verification_status',
        },
        verifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'verified_at' },
      },
      {
        tableName: 'employer_profiles',
        modelName: 'EmployerProfile',
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

module.exports = EmployerProfile
