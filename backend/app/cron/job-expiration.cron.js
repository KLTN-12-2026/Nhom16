const { Op } = require('sequelize')

const getVietnamDate = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)

const expireOverdueJobs = async (models, now = new Date()) => {
  const today = getVietnamDate(now)
  const [expiredCount] = await models.Job.update({
    status: 'EXPIRED',
    isPublic: false,
    isHidden: true,
    closedAt: now,
  }, {
    where: {
      status: { [Op.in]: ['ACTIVE', 'HIDDEN'] },
      deadline: { [Op.lt]: today },
    },
  })

  return expiredCount
}

module.exports = { expireOverdueJobs }
