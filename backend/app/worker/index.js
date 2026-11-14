const { createEmailWorker } = require('./email')
const { createCvWorker } = require('./cv')
const { createAiWorker } = require('./ai')

const initWorker = () => {
  const { connection, worker } = createEmailWorker()
  const cv = createCvWorker()
  const ai = createAiWorker()
  return {
    async close() {
      await Promise.all([worker.close(), cv.worker.close(), ai.worker.close()])
      await Promise.all([connection.quit(), cv.connection.quit(), ai.connection.quit()])
    },
  }
}

module.exports = { createEmailWorker, initWorker }
