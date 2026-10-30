const yup = require('yup')
const { validationError } = require('../../util')

const renameCandidateCvSchema = yup.object({
  displayName: yup.string().trim().min(1, 'Tên CV không được để trống.').max(180, 'Tên CV không được vượt quá 180 ký tự.').required(),
}).noUnknown(true)

const presignCandidateCvSchema = yup.object({
  fileName: yup.string().trim().min(1).max(255).required('Tên file là bắt buộc.'),
  contentType: yup.string().oneOf([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ], 'CV chỉ chấp nhận PDF hoặc DOCX.').required(),
  sizeBytes: yup.number().integer().positive().required('Dung lượng file là bắt buộc.'),
}).noUnknown(true)

const confirmCandidateCvSchema = presignCandidateCvSchema.concat(yup.object({
  objectKey: yup.string().trim().min(1).max(700).required('Object key là bắt buộc.'),
  displayName: yup.string().trim().max(180, 'Tên CV không được vượt quá 180 ký tự.').nullable(),
}))

const validateRenameCandidateCv = async (payload) => {
  try {
    return await renameCandidateCvSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Tên CV chưa hợp lệ.')
  }
}

const runValidation = (schema, message) => async (payload) => {
  try {
    return await schema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, message)
  }
}

module.exports = {
  validateConfirmCandidateCv: runValidation(confirmCandidateCvSchema, 'Thông tin xác nhận CV chưa hợp lệ.'),
  validatePresignCandidateCv: runValidation(presignCandidateCvSchema, 'File CV chưa hợp lệ.'),
  validateRenameCandidateCv,
}
