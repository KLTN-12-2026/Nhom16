const yup = require('yup')
const { validationError } = require('../../util')

const validate = (schema, message) => async (payload) => {
  try {
    return await schema.validate(payload, { abortEarly: false, stripUnknown: true })
  } catch (error) {
    throw validationError(error, message)
  }
}

const moderationSchema = yup.object({
  action: yup.string().trim().uppercase().oneOf(['APPROVE', 'HIDE', 'RESTORE', 'REMOVE'], 'Hành động kiểm duyệt không hợp lệ.').required('Vui lòng chọn hành động.'),
  reason: yup.string().trim().min(5, 'Lý do phải có ít nhất 5 ký tự.').max(1000, 'Lý do không được vượt quá 1000 ký tự.').required('Vui lòng nhập lý do kiểm duyệt.'),
}).noUnknown(true)

const catalogCreateSchema = yup.object({
  type: yup.string().trim().uppercase().oneOf(['INDUSTRY', 'SKILL', 'POSITION'], 'Loại danh mục không hợp lệ.').required('Vui lòng chọn loại danh mục.'),
  name: yup.string().trim().min(2, 'Tên danh mục phải có ít nhất 2 ký tự.').max(180).required('Vui lòng nhập tên danh mục.'),
  code: yup.string().trim().uppercase().max(10, 'Mã ngành không được vượt quá 10 ký tự.').nullable(),
  shortName: yup.string().trim().max(100).nullable(),
  legalReference: yup.string().trim().max(500).nullable(),
}).noUnknown(true)

const catalogToggleSchema = yup.object({
  active: yup.boolean().required('Vui lòng chọn trạng thái danh mục.'),
}).noUnknown(true)

const reportResolveSchema = yup.object({
  status: yup.string().trim().uppercase().oneOf(['RECEIVED', 'PROCESSING', 'RESOLVED', 'REJECTED'], 'Trạng thái xử lý không hợp lệ.').required('Vui lòng chọn trạng thái.'),
  resolution: yup.string().trim().min(5, 'Kết quả xử lý phải có ít nhất 5 ký tự.').max(2000).required('Vui lòng nhập kết quả xử lý.'),
  actionTaken: yup.string().trim().max(1000).nullable(),
}).noUnknown(true)

const reportCreateSchema = yup.object({
  reportType: yup.string().trim().uppercase().min(2).max(40).required('Vui lòng chọn loại báo cáo.'),
  content: yup.string().trim().min(10, 'Nội dung báo cáo phải có ít nhất 10 ký tự.').max(5000).required('Vui lòng nhập nội dung báo cáo.'),
  entityType: yup.string().trim().uppercase().max(50).nullable(),
  entityId: yup.number().integer().positive().nullable(),
}).noUnknown(true)

const validateJobModeration = validate(moderationSchema, 'Dữ liệu kiểm duyệt tin không hợp lệ.')
const validateCatalogCreate = validate(catalogCreateSchema, 'Dữ liệu danh mục không hợp lệ.')
const validateCatalogToggle = validate(catalogToggleSchema, 'Trạng thái danh mục không hợp lệ.')
const validateReportResolve = validate(reportResolveSchema, 'Dữ liệu xử lý báo cáo không hợp lệ.')
const validateReportCreate = validate(reportCreateSchema, 'Dữ liệu báo cáo không hợp lệ.')

module.exports = {
  validateCatalogCreate,
  validateCatalogToggle,
  validateJobModeration,
  validateReportCreate,
  validateReportResolve,
}
