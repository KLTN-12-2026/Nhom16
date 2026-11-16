const assert = require('node:assert/strict')

const { requirePermission } = require('../../app/middleware/auth/require-permission.middleware')

describe('requirePermission middleware', () => {
  it('continues when the authenticated user owns the permission', () => {
    let received
    requirePermission('admin.job.manage')({ user: { permissions: ['admin.job.manage'] } }, {}, (error) => { received = error || null })

    assert.equal(received, null)
  })

  it('returns forbidden when permission is missing', () => {
    let received
    requirePermission('admin.job.manage')({ user: { permissions: [] } }, {}, (error) => { received = error })

    assert.equal(received.statusCode, 403)
    assert.equal(received.code, 'FORBIDDEN')
  })
})
