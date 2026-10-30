const { Op } = require('sequelize')
const { db } = require('../../db')

const EXPERIENCE_LABELS = { NONE: 'Không yêu cầu', '1_2': '1 - 2 năm', '2_5': '2 - 5 năm', OVER_5: 'Trên 5 năm' }
const WORK_MODE_LABELS = { OFFICE: 'Tại văn phòng', HYBRID: 'Hybrid', REMOTE: 'Từ xa' }
const EMPLOYMENT_LABELS = { FULL_TIME: 'Toàn thời gian', PART_TIME: 'Bán thời gian', INTERNSHIP: 'Thực tập', CONTRACT: 'Hợp đồng' }
const POSITION_LABELS = { INTERN: 'Thực tập sinh', STAFF: 'Nhân viên', MANAGER: 'Quản lý' }

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

const formatSalary = (minimum, maximum) => {
  if (!minimum && !maximum) return 'Thỏa thuận'
  const toMillion = (value) => `${Math.round(value / 1000000)} triệu`
  if (!maximum) return `Từ ${toMillion(minimum)}`
  if (!minimum) return `Đến ${toMillion(maximum)}`
  return `${toMillion(minimum)} - ${toMillion(maximum)}`
}

const formatRelativeTime = (date) => {
  const hours = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 3600000))
  return hours < 24 ? `${hours} giờ trước` : `${Math.floor(hours / 24)} ngày trước`
}

const serializeJob = (job) => ({
  id: Number(job.id), title: job.title, company: job.company, companyLogo: job.companyLogo,
  companyLogoClass: `job-logo--${job.logoColor}`,
  category: job.category ? { id: job.category.id, code: job.category.code, name: job.category.name, shortName: job.category.shortName } : null,
  salary: formatSalary(job.salaryMin, job.salaryMax), salaryMin: job.salaryMin, salaryMax: job.salaryMax,
  location: job.location, workMode: job.workMode, workModeLabel: WORK_MODE_LABELS[job.workMode] || job.workMode,
  experienceLevel: job.experienceLevel, experienceLabel: EXPERIENCE_LABELS[job.experienceLevel] || job.experienceLevel,
  employmentType: job.employmentType, employmentTypeLabel: EMPLOYMENT_LABELS[job.employmentType] || job.employmentType,
  positionLevel: job.positionLevel, positionLabel: POSITION_LABELS[job.positionLevel] || job.positionLevel,
  postedAt: formatRelativeTime(job.publishedAt), publishedAt: job.publishedAt, deadline: job.deadline,
  status: job.status, tags: asArray(job.skills), description: job.description,
  requirements: asArray(job.requirements), benefits: asArray(job.benefits),
})

const salaryCondition = (salary) => {
  if (salary === 'UNDER_10') return { salaryMin: { [Op.lt]: 10000000 } }
  if (salary === '10_20') return { salaryMin: { [Op.lt]: 20000000 }, salaryMax: { [Op.gte]: 10000000 } }
  if (salary === '20_30') return { salaryMin: { [Op.lt]: 30000000 }, salaryMax: { [Op.gte]: 20000000 } }
  if (salary === 'OVER_30') return { salaryMax: { [Op.gte]: 30000000 } }
  return {}
}

const getPublicJobs = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(30, Math.max(1, Number(query.limit) || 8))
  const where = {
    status: 'ACTIVE', isPublic: true, isHidden: false,
    deadline: { [Op.gte]: new Date().toISOString().slice(0, 10) },
    ...salaryCondition(query.salary),
  }
  const search = String(query.search || '').trim()
  if (search) where[Op.or] = [
    { title: { [Op.like]: `%${search}%` } },
    { company: { [Op.like]: `%${search}%` } },
    { description: { [Op.like]: `%${search}%` } },
  ]
  if (query.location) where.location = query.location
  if (query.workMode) where.workMode = query.workMode
  if (query.experience) where.experienceLevel = query.experience
  if (query.employmentType) where.employmentType = query.employmentType
  if (query.positionLevel) where.positionLevel = query.positionLevel

  const categoryWhere = { active: true }
  if (query.category) categoryWhere.code = query.category
  const order = query.sort === 'SALARY_DESC' ? [['salaryMax', 'DESC']]
    : query.sort === 'SALARY_ASC' ? [['salaryMin', 'ASC']] : [['publishedAt', 'DESC']]
  const result = await db.Job.findAndCountAll({
    where,
    include: [{ model: db.JobCategory, as: 'category', where: categoryWhere, required: true }],
    limit, offset: (page - 1) * limit, order, distinct: true,
  })
  return {
    jobs: result.rows.map(serializeJob),
    pagination: { page, limit, total: result.count, totalPages: Math.max(1, Math.ceil(result.count / limit)) },
  }
}

const getPublicJobById = async (id) => {
  const job = await db.Job.findOne({
    where: { id, status: 'ACTIVE', isPublic: true, isHidden: false, deadline: { [Op.gte]: new Date().toISOString().slice(0, 10) } },
    include: [{ model: db.JobCategory, as: 'category', where: { active: true }, required: true }],
  })
  return job ? serializeJob(job) : null
}

const getActiveJobCategories = () => db.JobCategory.findAll({
  where: { active: true },
  attributes: ['id', 'code', 'name', 'shortName', 'legalReference'],
  order: [['id', 'ASC']],
})

module.exports = { getActiveJobCategories, getPublicJobById, getPublicJobs }
