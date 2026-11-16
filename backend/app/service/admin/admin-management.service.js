const { Op, fn, col } = require('sequelize')
const { db } = require('../../db')
const { ApiError } = require('../../util')

const JOB_ACTIONS = Object.freeze({
  APPROVE: { status: 'ACTIVE', isPublic: true, isHidden: false, closedAt: null },
  HIDE: { status: 'HIDDEN', isPublic: false, isHidden: true },
  RESTORE: { status: 'ACTIVE', isPublic: true, isHidden: false, closedAt: null },
  REMOVE: { status: 'CLOSED', isPublic: false, isHidden: true, closedAt: () => new Date() },
})

const REPORT_STATUSES = Object.freeze(['RECEIVED', 'PROCESSING', 'RESOLVED', 'REJECTED'])
const CATALOG_TYPES = Object.freeze(['INDUSTRY', 'SKILL', 'POSITION'])

const audit = (transaction, adminId, action, entityType, entityId, reason, metadata) =>
  db.AdminAuditLog.create({ adminId, action, entityType, entityId, reason, metadata }, { transaction })

const dateWhere = (field, from, to) => {
  if (!from && !to) return undefined
  return { [field]: { ...(from ? { [Op.gte]: new Date(from) } : {}), ...(to ? { [Op.lte]: new Date(`${to}T23:59:59`) } : {}) } }
}

const countByStatus = async (Model, where = {}) => {
  const rows = await Model.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    where,
    group: ['status'],
    raw: true,
  })
  return rows.reduce((result, row) => ({ ...result, [row.status]: Number(row.count) }), {})
}

const getDashboard = async ({ from, to } = {}) => {
  const userWhere = dateWhere('createdAt', from, to) || {}
  const createdWhere = dateWhere('createdAt', from, to) || {}
  const appliedWhere = dateWhere('appliedAt', from, to) || {}
  const [users, employers, jobs, applications, userStatuses, jobStatuses, applicationStatuses] = await Promise.all([
    db.User.count({ where: userWhere }),
    db.EmployerProfile.count({ where: createdWhere }),
    db.Job.count({ where: createdWhere }),
    db.Application.count({ where: appliedWhere }),
    countByStatus(db.User, userWhere),
    countByStatus(db.Job, createdWhere),
    countByStatus(db.Application, appliedWhere),
  ])

  return {
    totals: { users, employers, jobs, applications },
    breakdowns: { users: userStatuses, jobs: jobStatuses, applications: applicationStatuses },
    period: { from: from || null, to: to || null },
    updatedAt: new Date(),
  }
}

const listJobs = async ({ page = 1, limit = 20, search, company, status, from, to } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const safePage = Math.max(Number(page) || 1, 1)
  const where = { ...(status ? { status } : {}), ...(company ? { company: { [Op.like]: `%${company}%` } } : {}), ...(dateWhere('createdAt', from, to) || {}) }
  if (search) where[Op.or] = [{ title: { [Op.like]: `%${search}%` } }, { company: { [Op.like]: `%${search}%` } }]

  const { rows, count } = await db.Job.findAndCountAll({
    where,
    include: [
      { model: db.JobCategory, as: 'category', attributes: ['id', 'code', 'name'] },
      { model: db.EmployerProfile, as: 'employerProfile', attributes: ['id', 'companyName', 'verificationStatus'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  })
  return { items: rows, pagination: { page: safePage, limit: safeLimit, total: count, totalPages: Math.ceil(count / safeLimit) } }
}

const listAuditLogs = async ({ entityType, entityId, page = 1, limit = 20 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const safePage = Math.max(Number(page) || 1, 1)
  const where = {
    ...(entityType ? { entityType: String(entityType).toUpperCase() } : {}),
    ...(entityId ? { entityId } : {}),
  }
  const { rows, count } = await db.AdminAuditLog.findAndCountAll({
    where,
    attributes: ['id', 'action', 'entityType', 'entityId', 'reason', 'metadata', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  })
  return { items: rows, pagination: { page: safePage, limit: safeLimit, total: count, totalPages: Math.ceil(count / safeLimit) } }
}

const moderateJob = async (id, { action, reason }, admin) => {
  const normalizedAction = String(action || '').toUpperCase()
  const changes = JOB_ACTIONS[normalizedAction]
  if (!changes) throw new ApiError(400, 'Hành động kiểm duyệt không hợp lệ.', 'INVALID_JOB_ACTION')
  if (!String(reason || '').trim()) throw new ApiError(400, 'Vui lòng nhập lý do kiểm duyệt.', 'REASON_REQUIRED')

  return db.sequelize.transaction(async (transaction) => {
    const job = await db.Job.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!job) throw new ApiError(404, 'Không tìm thấy tin tuyển dụng.', 'JOB_NOT_FOUND')
    const previousStatus = job.status
    const resolvedChanges = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, typeof value === 'function' ? value() : value]))
    await job.update(resolvedChanges, { transaction })
    await audit(transaction, admin.id, `JOB_${normalizedAction}`, 'JOB', job.id, reason.trim(), { previousStatus, nextStatus: job.status })
    if (job.createdById) {
      await db.Notification.create({
        userId: job.createdById,
        type: 'ADMIN_JOB_MODERATION',
        title: `Tin tuyển dụng đã được ${normalizedAction === 'APPROVE' || normalizedAction === 'RESTORE' ? 'phê duyệt' : 'cập nhật'}`,
        message: `${job.title}: ${reason.trim()}`,
        entityType: 'JOB',
        entityId: job.id,
      }, { transaction })
    }
    return job.reload({ transaction })
  })
}

const listCatalogs = async () => {
  const [industries, catalogItems] = await Promise.all([
    db.JobCategory.findAll({ order: [['name', 'ASC']] }),
    db.AdminCatalogItem.findAll({ order: [['type', 'ASC'], ['name', 'ASC']] }),
  ])
  return {
    industries,
    skills: catalogItems.filter((item) => item.type === 'SKILL'),
    positions: catalogItems.filter((item) => item.type === 'POSITION'),
  }
}

const createCatalog = async (payload, admin) => {
  const type = String(payload.type || '').toUpperCase()
  const name = String(payload.name || '').trim()
  if (!CATALOG_TYPES.includes(type) || !name) throw new ApiError(400, 'Dữ liệu danh mục không hợp lệ.', 'INVALID_CATALOG')

  return db.sequelize.transaction(async (transaction) => {
    let item
    if (type === 'INDUSTRY') {
      const code = String(payload.code || '').trim().toUpperCase()
      if (!code) throw new ApiError(400, 'Mã ngành nghề là bắt buộc.', 'CATEGORY_CODE_REQUIRED')
      const exists = await db.JobCategory.findOne({ where: { [Op.or]: [{ code }, { name }] }, transaction })
      if (exists) throw new ApiError(409, 'Danh mục đã tồn tại.', 'CATALOG_EXISTS')
      item = await db.JobCategory.create({ code, name, shortName: payload.shortName || name, legalReference: payload.legalReference || 'Danh mục nội bộ', active: true }, { transaction })
    } else {
      const exists = await db.AdminCatalogItem.findOne({ where: { type, name }, transaction })
      if (exists) throw new ApiError(409, 'Danh mục đã tồn tại.', 'CATALOG_EXISTS')
      item = await db.AdminCatalogItem.create({ type, name, active: true, createdById: admin.id }, { transaction })
    }
    await audit(transaction, admin.id, 'CATALOG_CREATE', type, item.id, null, { name })
    return item
  })
}

const toggleCatalog = async (typeValue, id, { active }, admin) => {
  const type = String(typeValue || '').toUpperCase()
  if (!CATALOG_TYPES.includes(type) || typeof active !== 'boolean') throw new ApiError(400, 'Dữ liệu cập nhật không hợp lệ.', 'INVALID_CATALOG_UPDATE')
  return db.sequelize.transaction(async (transaction) => {
    const Model = type === 'INDUSTRY' ? db.JobCategory : db.AdminCatalogItem
    const item = await Model.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!item || (type !== 'INDUSTRY' && item.type !== type)) throw new ApiError(404, 'Không tìm thấy danh mục.', 'CATALOG_NOT_FOUND')
    await item.update({ active }, { transaction })
    await audit(transaction, admin.id, active ? 'CATALOG_ACTIVATE' : 'CATALOG_DEACTIVATE', type, item.id, null, { name: item.name })
    return item
  })
}

const createReport = async (payload, reporter) => {
  const reportType = String(payload.reportType || '').trim().toUpperCase()
  const content = String(payload.content || '').trim()
  if (!reportType || content.length < 10) throw new ApiError(400, 'Nội dung báo cáo phải có ít nhất 10 ký tự.', 'INVALID_REPORT')
  return db.UserReport.create({ reporterId: reporter.id, reportType, content, entityType: payload.entityType || null, entityId: payload.entityId || null })
}

const listReports = async ({ page = 1, limit = 20, status, reportType } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const safePage = Math.max(Number(page) || 1, 1)
  const where = { ...(status ? { status } : {}), ...(reportType ? { reportType } : {}) }
  const { rows, count } = await db.UserReport.findAndCountAll({ where, attributes: { exclude: ['reporterId'] }, order: [['createdAt', 'DESC']], limit: safeLimit, offset: (safePage - 1) * safeLimit })
  return { items: rows, pagination: { page: safePage, limit: safeLimit, total: count, totalPages: Math.ceil(count / safeLimit) } }
}

const resolveReport = async (id, { status, resolution, actionTaken }, admin) => {
  const normalizedStatus = String(status || '').toUpperCase()
  if (!REPORT_STATUSES.includes(normalizedStatus)) throw new ApiError(400, 'Trạng thái xử lý không hợp lệ.', 'INVALID_REPORT_STATUS')
  if (!String(resolution || '').trim()) throw new ApiError(400, 'Vui lòng nhập kết quả xử lý.', 'RESOLUTION_REQUIRED')
  return db.sequelize.transaction(async (transaction) => {
    const report = await db.UserReport.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!report) throw new ApiError(404, 'Không tìm thấy báo cáo.', 'REPORT_NOT_FOUND')
    await report.update({ status: normalizedStatus, resolution: resolution.trim(), actionTaken: actionTaken || null, handledById: admin.id, handledAt: new Date() }, { transaction })
    await audit(transaction, admin.id, 'REPORT_UPDATE', 'REPORT', report.id, resolution.trim(), { actionTaken: actionTaken || null, status: normalizedStatus })
    await db.Notification.create({ userId: report.reporterId, type: 'REPORT_STATUS_UPDATED', title: 'Báo cáo của bạn đã được cập nhật', message: resolution.trim(), entityType: 'REPORT', entityId: report.id }, { transaction })
    return report
  })
}

module.exports = { createCatalog, createReport, getDashboard, listAuditLogs, listCatalogs, listJobs, listReports, moderateJob, resolveReport, toggleCatalog }
