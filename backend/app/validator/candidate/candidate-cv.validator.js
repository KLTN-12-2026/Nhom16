const yup = require('yup')
const { validationError } = require('../../util')

const renameCandidateCvSchema = yup.object({
  displayName: yup.string().trim().min(1, 'Tên CV không được để trống.').max(180, 'Tên CV không được vượt quá 180 ký tự.').required(),
}).noUnknown(true)

const validateRenameCandidateCv = async (payload) => {
  try {
    return await renameCandidateCvSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Tên CV chưa hợp lệ.')
  }
}

module.exports = { validateRenameCandidateCv }
