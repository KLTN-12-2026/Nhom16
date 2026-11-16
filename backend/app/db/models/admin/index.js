const AdminAuditLog = require('./admin-audit-log.model')
const AdminCatalogItem = require('./admin-catalog-item.model')
const UserReport = require('./user-report.model')
const initAdminModel = (sequelize) => ({ AdminAuditLog: AdminAuditLog.init(sequelize), AdminCatalogItem: AdminCatalogItem.init(sequelize), UserReport: UserReport.init(sequelize) })
module.exports = { initAdminModel }
