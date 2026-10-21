export const PERMISSION = {
  CANDIDATE_PROFILE_UPDATE: 'candidate.profile.update',
  CV_MANAGE: 'cv.manage',
  CV_ANALYZE: 'cv.analyze',
  CV_EVALUATE: 'cv.evaluate',
  CV_IMPROVE: 'cv.improve',
  JOB_RECOMMENDATION_VIEW: 'job.recommendation.view',
  APPLICATION_CREATE: 'application.create',
  FAVORITE_JOB_MANAGE: 'favorite.job.manage',
  EMPLOYER_PROFILE_UPDATE: 'employer.profile.update',
  JOB_MANAGE: 'job.manage',
  JD_MANAGE: 'jd.manage',
  JD_ANALYZE: 'jd.analyze',
  CANDIDATE_RECOMMENDATION_VIEW: 'candidate.recommendation.view',
  APPLICATION_MANAGE: 'application.manage',
  APPLICATION_STATUS_UPDATE: 'application.status.update',
  FAVORITE_CANDIDATE_MANAGE: 'favorite.candidate.manage',
  MATCH_RESULT_VIEW: 'match.result.view',
  ADMIN_USER_MANAGE: 'admin.user.manage',
  ADMIN_JOB_MANAGE: 'admin.job.manage',
  ADMIN_CATEGORY_MANAGE: 'admin.category.manage',
  ADMIN_REPORT_MANAGE: 'admin.report.manage',
  ADMIN_STATISTICS_VIEW: 'admin.statistics.view',
} as const

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION]

export const ADMIN_PERMISSIONS: Permission[] = [
  PERMISSION.ADMIN_USER_MANAGE,
  PERMISSION.ADMIN_JOB_MANAGE,
  PERMISSION.ADMIN_CATEGORY_MANAGE,
  PERMISSION.ADMIN_REPORT_MANAGE,
  PERMISSION.ADMIN_STATISTICS_VIEW,
]
