const assert = require('node:assert/strict')
const { buildControllerDependencies } = require('../../app')

describe('application controller dependencies', () => {
  it('exposes every initialized queue to its controller', () => {
    const queue = {
      aiQueue: { name: 'ai' },
      cvQueue: { name: 'cv' },
      emailQueue: { name: 'email' },
    }
    const dependencies = buildControllerDependencies({
      database: { name: 'database' },
      models: { name: 'models' },
      queue,
      redisClient: { name: 'redis' },
    })

    assert.equal(dependencies.aiQueue, queue.aiQueue)
    assert.equal(dependencies.cvQueue, queue.cvQueue)
    assert.equal(dependencies.emailQueue, queue.emailQueue)
  })
})
