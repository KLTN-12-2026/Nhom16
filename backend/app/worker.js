const { createEmailWorker } = require('./worker')

const startWorker = () => {
  const { connection, worker } = createEmailWorker()

  const shutdown = async (signal) => {
    console.log(`${signal} received, stopping workers`)
    await worker.close()
    await connection.quit()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  console.log('Email worker is ready')
}

startWorker()
