const { db } = require('../../db')
const { ApiError } = require('../../util')

const assertVisibleCandidate = async (employerId, candidateId) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId: employerId } })
  const application = await db.Application.findOne({ where: { candidateId }, include: [{ model: db.Job, as: 'job', where: { employerProfileId: profile?.id }, required: true }] })
  if (!application) throw new ApiError(403, 'Bạn chỉ có thể lưu ứng viên đã ứng tuyển vào tin của doanh nghiệp.', 'CANDIDATE_NOT_VISIBLE')
}

const toggleFavoriteCandidate = async (employerId, candidateId) => {
  await assertVisibleCandidate(employerId, candidateId)
  const favorite = await db.FavoriteCandidate.findOne({ where: { employerId, candidateId } })
  if (favorite) { await favorite.destroy(); return { favorite: false, candidateId: Number(candidateId) } }
  await db.FavoriteCandidate.create({ employerId, candidateId })
  return { favorite: true, candidateId: Number(candidateId) }
}

const listFavoriteCandidates = async (employerId) => db.FavoriteCandidate.findAll({
  where: { employerId }, include: [{ model: db.User, as: 'candidate', attributes: ['id', 'fullName', 'email'], include: [{ model: db.CandidateProfile, as: 'candidateProfile', attributes: ['avatar', 'phone', 'title', 'skills'] }] }], order: [['createdAt', 'DESC']],
})

module.exports = { listFavoriteCandidates, toggleFavoriteCandidate }
