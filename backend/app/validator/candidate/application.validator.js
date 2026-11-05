const yup = require('yup')
const { validationError } = require('../../util')

const validateApplication = async (payload) => {
  try { return await yup.object({ jobId: yup.number().integer().positive().required(), cvId: yup.number().integer().positive().required(), coverLetter: yup.string().trim().max(3000).nullable().transform(value => value || null) }).noUnknown(true).validate(payload, { abortEarly: false, stripUnknown: true }) }
  catch (error) { throw validationError(error, 'Thông tin ứng tuyển chưa hợp lệ.') }
}

const validateApplicationStatus = async (payload) => {
  try { return await yup.object({ status: yup.string().oneOf(['REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED']).required(), note: yup.string().trim().max(1000).nullable().transform(value => value || null) }).noUnknown(true).validate(payload, { abortEarly: false, stripUnknown: true }) }
  catch (error) { throw validationError(error, 'Trạng thái hồ sơ chưa hợp lệ.') }
}

module.exports = { validateApplication, validateApplicationStatus }
