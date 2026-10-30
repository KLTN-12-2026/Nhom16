const { createEmailWorker } = require('./email')
const { createCvWorker } = require('./cv')

const initWorker = () => {
  const { connection, worker } = createEmailWorker()
  const cv = createCvWorker()
  return {
    async close() {
      await Promise.all([worker.close(), cv.worker.close()])
      await Promise.all([connection.quit(), cv.connection.quit()])
    },
  }
}

module.exports = { createEmailWorker, initWorker }
