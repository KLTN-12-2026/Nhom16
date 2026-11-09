const { expireOverdueJobs } = require('./job-expiration.cron')

const JOB_EXPIRATION_INTERVAL_MS = 60 * 60 * 1000

const initCronTasks = async ({ models }) => {
  const runJobExpiration = () => expireOverdueJobs(models).catch((error) => {
    console.error('Unable to expire overdue jobs:', error)
  })

  await runJobExpiration()
  const timer = setInterval(runJobExpiration, JOB_EXPIRATION_INTERVAL_MS)
  timer.unref?.()

  return {
    close() {
      clearInterval(timer)
    },
  }
}

module.exports = { initCronTasks }
