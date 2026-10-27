const assert = require('node:assert/strict')

const { createEmployerReviewService } = require('../../app/service/admin')
const { EMAIL_JOBS } = require('../../app/queue')
const { createEmployerReviewEmail } = require('../../app/template')

describe('employer review service', () => {
  const createFixture = (status = 'PENDING_REVIEW') => {
    const jobs = []
    const profile = {
      id: 7,
      companyName: 'Demo Company',
      verificationStatus: status,
      user: { email: 'owner@example.com', fullName: 'Owner' },
      update: async (values) => Object.assign(profile, values),
    }
    const service = createEmployerReviewService({
      database: { transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }) },
      models: { EmployerProfile: { findByPk: async () => profile }, User: {} },
      emailQueue: { add: async (...args) => jobs.push(args) },
    })
    return { jobs, profile, service }
  }

  it('approves a pending profile and queues the approval email', async () => {
    const { jobs, profile, service } = createFixture()
    const result = await service.review(7, { decision: 'APPROVE', reason: '' })
    assert.equal(result.verificationStatus, 'VERIFIED')
    assert.equal(profile.verificationStatus, 'VERIFIED')
    assert.equal(jobs[0][0], EMAIL_JOBS.EMPLOYER_REVIEW)
    assert.equal(jobs[0][1].email, 'owner@example.com')
  })

  it('rejects an already reviewed profile without sending another email', async () => {
    const { jobs, service } = createFixture('VERIFIED')
    await assert.rejects(service.review(7, { decision: 'REJECT', reason: 'Reason' }), (error) => error.statusCode === 409)
    assert.equal(jobs.length, 0)
  })

  it('escapes submitted text in the rejection email', () => {
    const email = createEmployerReviewEmail({ fullName: '<Admin>', companyName: 'Demo', verificationStatus: 'REJECTED', reason: '<script>' })
    assert.match(email.html, /&lt;script&gt;/)
    assert.doesNotMatch(email.html, /<script>/)
  })
})
