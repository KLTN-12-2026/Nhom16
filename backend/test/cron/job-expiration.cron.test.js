const assert = require('node:assert/strict')

const { expireOverdueJobs } = require('../../app/cron/job-expiration.cron')

describe('job expiration cron', () => {
  it('marks active and hidden overdue jobs as expired', async () => {
    let updateValues
    let updateOptions
    const models = {
      Job: {
        update: async (values, options) => {
          updateValues = values
          updateOptions = options
          return [3]
        },
      },
    }
    const now = new Date('2026-11-09T08:00:00.000Z')

    const count = await expireOverdueJobs(models, now)

    assert.equal(count, 3)
    assert.deepEqual(updateValues, {
      status: 'EXPIRED',
      isPublic: false,
      isHidden: true,
      closedAt: now,
    })
    assert.deepEqual(updateOptions.where.status[Object.getOwnPropertySymbols(updateOptions.where.status)[0]], ['ACTIVE', 'HIDDEN'])
    assert.equal(updateOptions.where.deadline[Object.getOwnPropertySymbols(updateOptions.where.deadline)[0]], '2026-11-09')
  })
})
