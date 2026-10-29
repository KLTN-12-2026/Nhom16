const { db } = require('../../db')
const { ApiError } = require('../../util')

const getCandidateProfile = async (userId) => {
  const user = await db.User.findByPk(userId, {
    attributes: ['id', 'email', 'fullName', 'status', 'emailVerifiedAt', 'lastLoginAt'],
    include: [{ model: db.CandidateProfile, as: 'candidateProfile' }],
  })
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND')
  return user
}

const updateCandidateProfile = async (userId, payload) => {
  const user = await db.User.findByPk(userId)
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  return await db.sequelize.transaction(async (t) => {
    if (payload.fullName) {
      await user.update({ fullName: payload.fullName.trim() }, { transaction: t })
    }

    let [profile] = await db.CandidateProfile.findOrCreate({
      where: { userId },
      defaults: { userId },
      transaction: t,
    })

    const profileData = {}
    if (payload.phone !== undefined) profileData.phone = payload.phone
    if (payload.address !== undefined) profileData.address = payload.address
    if (payload.title !== undefined) profileData.title = payload.title
    if (payload.bio !== undefined) profileData.bio = payload.bio
    if (payload.skills !== undefined) profileData.skills = payload.skills
    if (payload.education !== undefined) profileData.education = payload.education
    if (payload.experience !== undefined) profileData.experience = payload.experience

    await profile.update(profileData, { transaction: t })
    return await getCandidateProfile(userId)
  })
}

module.exports = { getCandidateProfile, updateCandidateProfile }
