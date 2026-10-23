const { env } = require('./config/env')
const { initApplication } = require('./index')

const startServer = async () => {
  const application = await initApplication()
  const server = application.app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`)
  })

  let shuttingDown = false
  const shutdown = (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`${signal} received, shutting down gracefully`)
    server.close(async () => {
      await application.close()
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

startServer().catch((error) => {
  console.error('Unable to start API:', error)
  process.exit(1)
})
