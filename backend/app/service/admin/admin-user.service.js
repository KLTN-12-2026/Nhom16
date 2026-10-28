const { Op } = require('sequelize')
const { db } = require('../../db')
const { ApiError } = require('../../util')

const getAdminUsers = async ({ page = 1, limit = 10, search = '', roleId, status }) => {
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit))
  const where = {}

  if (search && search.trim()) {
    const s = search.trim()
    where[Op.or] = [
      { email: { [Op.like]: `%${s}%` } },
      { fullName: { [Op.like]: `%${s}%` } },
    ]
  }

  if (status) {
    where.status = status
  }

  const roleInclude = {
    model: db.Role,
    as: 'roles',
    through: { attributes: [] },
  }
  if (roleId) {
    roleInclude.where = { id: parseInt(roleId) }
  }

  const { count, rows } = await db.User.findAndCountAll({
    where,
    include: [
      roleInclude,
      { model: db.EmployerProfile, as: 'employerProfile', attributes: ['companyName', 'taxCode'] },
    ],
    attributes: ['id', 'email', 'fullName', 'status', 'emailVerifiedAt', 'lastLoginAt', 'createdAt'],
    distinct: true,
    order: [['id', 'ASC']],
    limit: parseInt(limit),
    offset,
  })

  return {
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count / parseInt(limit)),
    users: rows,
  }
}

const updateAdminUserStatus = async (targetUserId, { status, reason }, adminUser) => {
  const targetId = parseInt(targetUserId)
  if (targetId === adminUser.id && status !== 'ACTIVE') {
    throw new ApiError(400, 'Quản trị viên không được tự khóa tài khoản của chính mình.', 'CANNOT_LOCK_SELF')
  }

  const user = await db.User.findByPk(targetId)
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  await db.sequelize.transaction(async (t) => {
    await user.update({ status }, { transaction: t })
    if (status === 'LOCKED' || status === 'DISABLED') {
      await db.AuthSession.destroy({ where: { userId: targetId }, transaction: t })
    }
  })

  return user
}

const updateAdminUserRole = async (targetUserId, { roleId }, adminUser) => {
  const targetId = parseInt(targetUserId)
  const user = await db.User.findByPk(targetId)
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  const role = await db.Role.findByPk(roleId)
  if (!role) throw new ApiError(404, 'Không tìm thấy vai trò.', 'ROLE_NOT_FOUND')

  await db.sequelize.transaction(async (t) => {
    await db.UserRole.destroy({ where: { userId: targetId }, transaction: t })
    await db.UserRole.create({ userId: targetId, roleId }, { transaction: t })
    await db.AuthSession.destroy({ where: { userId: targetId }, transaction: t })
  })

  return await db.User.findByPk(targetId, {
    include: [{ model: db.Role, as: 'roles' }],
  })
}

const getAdminDashboardMetrics = async () => {
  const [userCount, employerCount] = await Promise.all([
    db.User.count(),
    db.EmployerProfile.count(),
  ])
  return {
    users: userCount,
    employers: employerCount,
    jobs: 3,
  }
}

module.exports = { getAdminUsers, updateAdminUserStatus, updateAdminUserRole, getAdminDashboardMetrics }
