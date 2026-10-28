const { db } = require('../../db')
const { ApiError } = require('../../util')

const getEmployerProfile = async (userId) => {
  const profile = await db.EmployerProfile.findOne({
    where: { userId },
    include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'fullName', 'status'] }],
  })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')
  return profile
}

const updateEmployerProfile = async (userId, payload) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')

  return await db.sequelize.transaction(async (t) => {
    const updateData = {}
    if (payload.companyName) updateData.companyName = payload.companyName.trim()
    if (payload.logo !== undefined) updateData.logo = payload.logo
    if (payload.companyPhone) updateData.companyPhone = payload.companyPhone.trim()
    if (payload.companyAddress) updateData.companyAddress = payload.companyAddress.trim()
    if (payload.companyWebsite !== undefined) updateData.companyWebsite = payload.companyWebsite
    if (payload.companySize !== undefined) updateData.companySize = payload.companySize
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.representativeName) updateData.representativeName = payload.representativeName.trim()
    if (payload.representativePosition) updateData.representativePosition = payload.representativePosition.trim()

    await profile.update(updateData, { transaction: t })
    return await getEmployerProfile(userId)
  })
}

module.exports = { getEmployerProfile, updateEmployerProfile }
