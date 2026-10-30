const { initWorker } = require('./worker/index')

const startWorker = () => {
  const workers = initWorker()

  const shutdown = async (signal) => {
    console.log(`${signal} received, stopping workers`)
    await workers.close()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  console.log('Email worker is ready')
}

startWorker()
