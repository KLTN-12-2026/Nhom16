const assert = require('node:assert/strict')

const { PERMISSIONS, PUBLIC_REGISTRATION_ROLES, ROLES, ROLE_PERMISSIONS } = require('../../app/constants')

describe('access control constants', () => {
  it('allows only candidate and employer roles in public registration', () => {
    assert.deepEqual(PUBLIC_REGISTRATION_ROLES, [ROLES.CANDIDATE, ROLES.EMPLOYER])
    assert.equal(PUBLIC_REGISTRATION_ROLES.includes(ROLES.ADMIN), false)
  })

  it('assigns every declared permission to exactly one intended role group', () => {
    const assignedPermissions = Object.values(ROLE_PERMISSIONS).flat()

    assert.equal(new Set(assignedPermissions).size, Object.values(PERMISSIONS).length)
    assert.deepEqual(new Set(assignedPermissions), new Set(Object.values(PERMISSIONS)))
  })

  it('does not expose administrative permissions to public roles', () => {
    const adminPermissions = ROLE_PERMISSIONS[ROLES.ADMIN]
    const publicPermissions = [
      ...ROLE_PERMISSIONS[ROLES.CANDIDATE],
      ...ROLE_PERMISSIONS[ROLES.EMPLOYER],
    ]

    assert.equal(publicPermissions.some((permission) => adminPermissions.includes(permission)), false)
  })
})
