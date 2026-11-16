const { DataTypes, Model } = require('sequelize')
class AdminCatalogItem extends Model {
  static init(sequelize, opts = {}) { return super.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, type: { type: DataTypes.STRING(30), allowNull: false }, name: { type: DataTypes.STRING(180), allowNull: false }, active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'created_by_id' } }, { tableName: 'admin_catalog_items', modelName: 'AdminCatalogItem', sequelize, ...opts }) }
  static associate(models) { this.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' }) }
}
module.exports = AdminCatalogItem
