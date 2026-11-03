const fs = require('node:fs/promises')
const path = require('node:path')

const { env } = require('../../config')
const { db } = require('../../db')
const { ApiError } = require('../../util')

const avatarRootDirectory = path.join(env.upload.rootDirectory, 'candidate-avatars')

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

  return await db.sequelize.transaction(async (transaction) => {
    if (payload.fullName) {
      await user.update({ fullName: payload.fullName.trim() }, { transaction })
    }

    let [profile] = await db.CandidateProfile.findOrCreate({
      where: { userId },
      defaults: { userId },
      transaction,
    })

    const profileData = {}
    if (payload.avatar !== undefined) profileData.avatar = payload.avatar
    if (payload.phone !== undefined) profileData.phone = payload.phone
    if (payload.address !== undefined) profileData.address = payload.address
    if (payload.title !== undefined) profileData.title = payload.title
    if (payload.bio !== undefined) profileData.bio = payload.bio
    if (payload.skills !== undefined) profileData.skills = payload.skills
    if (payload.education !== undefined) profileData.education = payload.education
    if (payload.experience !== undefined) profileData.experience = payload.experience

    await profile.update(profileData, { transaction })
    return await getCandidateProfile(userId)
  })
}

const saveCandidateAvatar = async (userId, file) => {
  const user = await db.User.findByPk(userId)
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  let [profile] = await db.CandidateProfile.findOrCreate({
    where: { userId },
    defaults: { userId },
  })

  if (profile.avatar) {
    const oldFilePath = path.join(avatarRootDirectory, path.basename(profile.avatar))
    await fs.unlink(oldFilePath).catch((err) => {
      if (err.code !== 'ENOENT') console.error('Lỗi khi xóa ảnh đại diện cũ:', err)
    })
  }

  const avatarPath = `candidate-avatars/${file.filename}`
  await profile.update({ avatar: avatarPath })

  return await getCandidateProfile(userId)
}

const getCandidateAvatarPath = async (userId) => {
  const profile = await db.CandidateProfile.findOne({ where: { userId } })
  if (!profile || !profile.avatar) {
    throw new ApiError(404, 'Ứng viên chưa cập nhật ảnh đại diện.', 'AVATAR_NOT_FOUND')
  }

  const absolutePath = path.join(avatarRootDirectory, path.basename(profile.avatar))
  try {
    await fs.access(absolutePath)
  } catch {
    throw new ApiError(404, 'Không tìm thấy file ảnh đại diện trên máy chủ.', 'AVATAR_FILE_NOT_FOUND')
  }

  return absolutePath
}

const deleteCandidateAvatar = async (userId) => {
  const user = await db.User.findByPk(userId)
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  const profile = await db.CandidateProfile.findOne({ where: { userId } })
  if (profile && profile.avatar) {
    const oldFilePath = path.join(avatarRootDirectory, path.basename(profile.avatar))
    await fs.unlink(oldFilePath).catch(() => undefined)
    await profile.update({ avatar: null })
  }

  return await getCandidateProfile(userId)
}

module.exports = {
  getCandidateProfile,
  updateCandidateProfile,
  saveCandidateAvatar,
  getCandidateAvatarPath,
  deleteCandidateAvatar,
}
