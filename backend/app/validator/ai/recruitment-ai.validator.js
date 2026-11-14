const { ApiError } = require('../../util')
const validateJdAnalysisRequest = body => ({ force: body?.force === true })
const validateJdAnalysisUpdate = body => {
  const result = {}; const arrays = ['responsibilities', 'requiredSkills', 'preferredSkills', 'experienceRequirements', 'educationRequirements', 'keywords', 'mandatoryRequirements']
  if (body?.title !== undefined) result.title = String(body.title).trim().slice(0, 220)
  if (body?.summary !== undefined) result.summary = String(body.summary).trim().slice(0, 700)
  arrays.forEach(key => { if (body?.[key] !== undefined) { if (!Array.isArray(body[key])) throw new ApiError(422, `${key} phải là danh sách.`, 'VALIDATION_ERROR'); result[key] = body[key].map(item => String(item).trim()).filter(Boolean).slice(0, 15) } })
  return result
}
const validateComparisonRequest = body => { const cvId = Number(body?.cvId); const jobId = Number(body?.jobId); if (!Number.isInteger(cvId) || !Number.isInteger(jobId)) throw new ApiError(422, 'CV và tin tuyển dụng không hợp lệ.', 'VALIDATION_ERROR'); return { cvId, jobId, force: body?.force === true } }
module.exports = { validateComparisonRequest, validateJdAnalysisRequest, validateJdAnalysisUpdate }
