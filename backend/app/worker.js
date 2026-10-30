const { initWorker } = require('./worker/index')
const { closeDatabase, initDatabase } = require('./db')

const startWorker = async () => {
  await initDatabase()
  const workers = initWorker()

  const shutdown = async (signal) => {
    console.log(`${signal} received, stopping workers`)
    await workers.close()
    await closeDatabase()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  console.log('Email and CV workers are ready')
}

startWorker().catch((error) => {
  console.error('Worker startup failed:', error)
  process.exit(1)
})
