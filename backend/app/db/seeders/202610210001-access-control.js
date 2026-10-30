'use strict'

const { PERMISSIONS, ROLES, ROLE_CODES, ROLE_PERMISSIONS } = require('../../constants')

const humanize = (code) =>
  code
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

module.exports = {
  async up(queryInterface) {
    const now = new Date()
    const roleRows = Object.values(ROLES).map((id) => ({
      id,
      code: ROLE_CODES[id],
      name: id === ROLES.CANDIDATE ? 'Ứng viên' : id === ROLES.EMPLOYER ? 'Nhà tuyển dụng' : 'Quản trị viên',
      created_at: now,
      updated_at: now,
    }))
    const permissionRows = Object.values(PERMISSIONS).map((code) => ({
      code,
      name: humanize(code),
      created_at: now,
      updated_at: now,
    }))

    await queryInterface.bulkInsert('roles', roleRows, { ignoreDuplicates: true })
    await queryInterface.bulkInsert('permissions', permissionRows, { ignoreDuplicates: true })

    const [permissions] = await queryInterface.sequelize.query('SELECT id, code FROM permissions')
    const permissionIds = new Map(permissions.map((permission) => [permission.code, permission.id]))
    const assignments = Object.entries(ROLE_PERMISSIONS).flatMap(([role, permissionCodes]) =>
      permissionCodes.map((permission) => ({
        role_id: Number(role),
        permission_id: permissionIds.get(permission),
        created_at: now,
        updated_at: now,
      })),
    )

    const [existingRows] = await queryInterface.sequelize.query('SELECT role_id, permission_id FROM role_permissions')
    const existing = new Set(existingRows.map((row) => `${row.role_id}:${row.permission_id}`))
    const missingAssignments = assignments.filter((item) => !existing.has(`${item.role_id}:${item.permission_id}`))
    if (missingAssignments.length) await queryInterface.bulkInsert('role_permissions', missingAssignments)
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {})
    await queryInterface.bulkDelete('permissions', { code: Object.values(PERMISSIONS) }, {})
    await queryInterface.bulkDelete('roles', { id: Object.values(ROLES) }, {})
  },
}
