const assert = require('node:assert/strict')

const {
  validateCatalogCreate,
  validateCatalogToggle,
  validateJobModeration,
  validateReportCreate,
  validateReportResolve,
} = require('../../app/validator/admin/admin-management.validator')

describe('admin management validators', () => {
  it('normalizes valid job moderation data', async () => {
    const result = await validateJobModeration({ action: 'approve', reason: ' Tin tuyển dụng hợp lệ. ' })

    assert.equal(result.action, 'APPROVE')
    assert.equal(result.reason, 'Tin tuyển dụng hợp lệ.')
  })

  it('requires an explicit moderation reason', async () => {
    await assert.rejects(
      validateJobModeration({ action: 'HIDE', reason: '' }),
      (error) => error.statusCode === 422 && Boolean(error.details.reason),
    )
  })

  it('validates catalog type and activation state', async () => {
    const catalog = await validateCatalogCreate({ type: 'skill', name: 'Node.js' })
    const toggle = await validateCatalogToggle({ active: false })

    assert.equal(catalog.type, 'SKILL')
    assert.equal(toggle.active, false)
    await assert.rejects(validateCatalogCreate({ type: 'UNKNOWN', name: 'Sai' }), (error) => error.statusCode === 422)
  })

  it('validates anonymous-safe report payloads and resolution', async () => {
    const report = await validateReportCreate({ reportType: 'job', content: 'Tin tuyển dụng có nội dung không phù hợp.', entityType: 'job', entityId: 9 })
    const resolution = await validateReportResolve({ status: 'resolved', resolution: 'Đã kiểm tra và xử lý.', actionTaken: 'Ẩn tin tuyển dụng.' })

    assert.deepEqual(report, { reportType: 'JOB', content: 'Tin tuyển dụng có nội dung không phù hợp.', entityType: 'JOB', entityId: 9 })
    assert.equal(resolution.status, 'RESOLVED')
    assert.equal(resolution.actionTaken, 'Ẩn tin tuyển dụng.')
  })
})
