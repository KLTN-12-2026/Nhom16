'use strict'

const { PERMISSIONS, ROLES, ROLE_PERMISSIONS } = require('../../constants')

const humanize = (code) =>
  code
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

module.exports = {
  async up(queryInterface) {
    const now = new Date()
    const roleRows = Object.values(ROLES).map((code) => ({
      code,
      name: code === ROLES.CANDIDATE ? 'Ứng viên' : code === ROLES.EMPLOYER ? 'Nhà tuyển dụng' : 'Quản trị viên',
      created_at: now,
      updated_at: now,
    }))
    const permissionRows = Object.values(PERMISSIONS).map((code) => ({
      code,
      name: humanize(code),
      created_at: now,
      updated_at: now,
    }))

    await queryInterface.bulkInsert('roles', roleRows)
    await queryInterface.bulkInsert('permissions', permissionRows)

    const [roles] = await queryInterface.sequelize.query('SELECT id, code FROM roles')
    const [permissions] = await queryInterface.sequelize.query('SELECT id, code FROM permissions')
    const roleIds = new Map(roles.map((role) => [role.code, role.id]))
    const permissionIds = new Map(permissions.map((permission) => [permission.code, permission.id]))
    const assignments = Object.entries(ROLE_PERMISSIONS).flatMap(([role, permissionCodes]) =>
      permissionCodes.map((permission) => ({
        role_id: roleIds.get(role),
        permission_id: permissionIds.get(permission),
        created_at: now,
        updated_at: now,
      })),
    )

    await queryInterface.bulkInsert('role_permissions', assignments)
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {})
    await queryInterface.bulkDelete('permissions', { code: Object.values(PERMISSIONS) }, {})
    await queryInterface.bulkDelete('roles', { code: Object.values(ROLES) }, {})
  },
}
