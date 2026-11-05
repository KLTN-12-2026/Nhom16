const fs = require('node:fs/promises')
const path = require('node:path')

const { env } = require('../../config')
const { db } = require('../../db')
const { ApiError } = require('../../util')

const logoRootDirectory = path.join(env.upload.rootDirectory, 'employer-logos')

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

const saveEmployerLogo = async (userId, file) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')

  if (profile.logo && !profile.logo.startsWith('http://') && !profile.logo.startsWith('https://')) {
    const oldFilePath = path.join(logoRootDirectory, path.basename(profile.logo))
    await fs.unlink(oldFilePath).catch((err) => {
      if (err.code !== 'ENOENT') console.error('Lỗi khi xóa logo cũ:', err)
    })
  }

  const logoPath = `employer-logos/${file.filename}`
  await profile.update({ logo: logoPath })

  return await getEmployerProfile(userId)
}

const getEmployerLogoPath = async (userId) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile || !profile.logo) {
    throw new ApiError(404, 'Doanh nghiệp chưa cập nhật logo.', 'LOGO_NOT_FOUND')
  }

  if (profile.logo.startsWith('http://') || profile.logo.startsWith('https://')) {
    return { isExternal: true, url: profile.logo }
  }

  const absolutePath = path.join(logoRootDirectory, path.basename(profile.logo))
  try {
    await fs.access(absolutePath)
  } catch {
    throw new ApiError(404, 'Không tìm thấy file logo trên máy chủ.', 'LOGO_FILE_NOT_FOUND')
  }

  return { isExternal: false, absolutePath }
}

const deleteEmployerLogo = async (userId) => {
  const profile = await db.EmployerProfile.findOne({ where: { userId } })
  if (!profile) throw new ApiError(404, 'Không tìm thấy hồ sơ doanh nghiệp.', 'EMPLOYER_PROFILE_NOT_FOUND')

  if (profile.logo && !profile.logo.startsWith('http://') && !profile.logo.startsWith('https://')) {
    const oldFilePath = path.join(logoRootDirectory, path.basename(profile.logo))
    await fs.unlink(oldFilePath).catch(() => undefined)
  }

  await profile.update({ logo: null })
  return await getEmployerProfile(userId)
}

module.exports = {
  getEmployerProfile,
  updateEmployerProfile,
  saveEmployerLogo,
  getEmployerLogoPath,
  deleteEmployerLogo,
}
