const yup = require('yup')
const { validationError } = require('../../util')

const updateStatusSchema = yup.object({
  status: yup.string().oneOf(['ACTIVE', 'LOCKED', 'DISABLED'], 'Trạng thái không hợp lệ.').required('Vui lòng chọn trạng thái.'),
  reason: yup.string().trim().max(500).nullable(),
}).noUnknown(true)

const updateRoleSchema = yup.object({
  roleId: yup.number().integer().oneOf([1, 2, 3], 'Vai trò không hợp lệ.').required('Vui lòng chọn vai trò.'),
}).noUnknown(true)

const validateUpdateUserStatus = async (payload) => {
  try {
    return await updateStatusSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Dữ liệu trạng thái không hợp lệ.')
  }
}

const validateUpdateUserRole = async (payload) => {
  try {
    return await updateRoleSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, 'Dữ liệu vai trò không hợp lệ.')
  }
}

module.exports = { validateUpdateUserStatus, validateUpdateUserRole }
