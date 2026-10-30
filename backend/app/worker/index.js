const { createEmailWorker } = require('./email')

const initWorker = () => {
  const { connection, worker } = createEmailWorker()
  return {
    async close() {
      await worker.close()
      await connection.quit()
    },
  }
}

module.exports = { createEmailWorker, initWorker }
