import { fetchApi } from '../fetch-api'
import { ApiClientError, getApiUrl } from '../fetch-api'
import type { JobData } from '../job'

export interface EmployerJobInput { categoryId: number; title: string; salaryMin?: number | null; salaryMax?: number | null; location: string; workMode: string; experienceLevel: string; employmentType: string; positionLevel: string; description: string; requirements: string[]; benefits: string[]; skills: string[]; deadline: string; publish?: boolean }
export interface JobJdFileData { id: number; jobId?: number; originalName: string; sizeBytes: number; mimeType: string; createdAt?: string }
export interface ApplicationData { id: number; status: string; appliedAt: string; coverLetter?: string; job: JobData; candidate?: { id: number; fullName: string; email: string }; cv: { id: number; displayName: string; originalName?: string; headline?: string; skills?: string[] }; history?: Array<{ id: number; fromStatus: string | null; toStatus: string; note?: string | null; createdAt: string }> }

export const listEmployerJobsApi = () => fetchApi<JobData[]>('/employer/jobs')
export const getEmployerJobApi = (id: number | string) => fetchApi<JobData & { jdFiles?: JobJdFileData[] }>(`/employer/jobs/${id}`)
export const createEmployerJobApi = (data: EmployerJobInput) => fetchApi<JobData>('/employer/jobs', { method: 'POST', body: JSON.stringify(data) })
export const updateEmployerJobApi = (id: number, data: EmployerJobInput) => fetchApi<JobData>(`/employer/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const changeEmployerJobStatusApi = (id: number, action: 'publish' | 'hide' | 'close') => fetchApi<JobData>(`/employer/jobs/${id}/${action}`, { method: 'POST' })
export const cloneEmployerJobApi = (id: number) => fetchApi<JobData>(`/employer/jobs/${id}/clone`, { method: 'POST' })
export const uploadJobJdApi = (id: number | string, file: File) => { const body = new FormData(); body.append('file', file); return fetchApi<JobJdFileData>(`/employer/jobs/${id}/jd`, { method: 'POST', body }) }
export const deleteJobJdApi = (jobId: number | string, fileId: number | string) => fetchApi<{ id: number }>(`/employer/jobs/${jobId}/jd/${fileId}`, { method: 'DELETE' })
export const downloadEmployerJobJdApi = async (jobId: number | string, fileId: number | string, filename?: string) => {
  const response = await fetch(getApiUrl(`/employer/jobs/${jobId}/jd/${fileId}/download`), { credentials: 'include' })
  if (!response.ok) throw new ApiClientError(response.status, { code: 'JD_DOWNLOAD_FAILED', message: 'Không thể tải file JD.' })
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || `JD-${jobId}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
export const applyToJobApi = (jobId: number, cvId: number, coverLetter?: string) => fetchApi<ApplicationData>('/candidate/applications', { method: 'POST', body: JSON.stringify({ jobId, cvId, coverLetter }) })
export const listCandidateApplicationsApi = () => fetchApi<ApplicationData[]>('/candidate/applications')
export const getCandidateApplicationJobApi = (applicationId: number | string) => fetchApi<JobData>(`/candidate/applications/${applicationId}/job`)
export const listEmployerApplicationsApi = (jobId?: number) => fetchApi<ApplicationData[]>(`/employer/applications${jobId ? `?jobId=${jobId}` : ''}`)
export const updateApplicationStatusApi = (id: number, status: string, note?: string) => fetchApi<ApplicationData>(`/employer/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) })
export const downloadApplicationCvApi = async (application: ApplicationData) => { const response = await fetch(getApiUrl(`/employer/applications/${application.id}/cv/download`), { credentials: 'include' }); if (!response.ok) throw new ApiClientError(response.status, { code: 'CV_DOWNLOAD_FAILED', message: 'Không thể tải CV ứng viên.' }); const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = application.cv.originalName || `${application.cv.displayName}.pdf`; anchor.click(); URL.revokeObjectURL(url) }
export const toggleFavoriteCandidateApi = (candidateId: number) => fetchApi<{ favorite: boolean; candidateId: number }>(`/employer/favorite-candidates/${candidateId}/toggle`, { method: 'POST' })
export interface FavoriteCandidateData { id: number; createdAt: string; candidate: { id: number; fullName: string; email: string; candidateProfile?: { avatar?: string; phone?: string; title?: string; skills?: string[] } } }
export const listFavoriteCandidatesApi = () => fetchApi<FavoriteCandidateData[]>('/employer/favorite-candidates')
export const listFavoriteJobsApi = () => fetchApi<Array<{ id: number; createdAt: string; job: JobData }>>('/candidate/favorite-jobs')
export const toggleFavoriteJobApi = (jobId: number) => fetchApi<{ favorite: boolean; jobId: number }>(`/candidate/favorite-jobs/${jobId}/toggle`, { method: 'POST' })
export interface NotificationData { id: number; type: string; title: string; message: string; entityType?: string; entityId?: number; readAt: string | null; createdAt: string }
export const listNotificationsApi = () => fetchApi<NotificationData[]>('/candidate/notifications')
export const markNotificationReadApi = (id: number) => fetchApi<NotificationData>(`/candidate/notifications/${id}/read`, { method: 'PATCH' })

export interface UserReportInput {
  reportType: 'JOB' | 'USER' | 'COMPANY' | 'OTHER' | string
  content: string
  entityType?: 'JOB' | 'USER' | 'COMPANY' | 'OTHER' | string | null
  entityId?: number | null
}
export interface UserReportData {
  id: number
  reportType: string
  content: string
  entityType?: string | null
  entityId?: number | null
  status: string
  createdAt: string
}
export const submitReportApi = (payload: UserReportInput) =>
  fetchApi<UserReportData>('/reports', { method: 'POST', body: JSON.stringify(payload) })

export interface EmployerRecommendedJobSummary extends JobData {
  jdAnalysisVersion: number | null
  hasCompletedJdAnalysis: boolean
}

export interface EmployerCandidateRecommendationItem {
  rank: number
  matchScore: number
  matchTier: 'high' | 'medium' | 'low'
  scoreSource: 'ai_verified' | 'jd_matched'
  matchedCriteria: string[]
  partialCriteria: string[]
  missingCriteria: string[]
  matchedSkills: string[]
  missingRequirements: string[]
  explanation: string
  cvAnalysisVersion: number
  jdAnalysisVersion: number | null
  isFavorite: boolean
  candidate: {
    id: number
    fullName: string
    email: string
    title: string
    skills: string[]
  }
  cv: {
    id: number
    displayName: string
    originalName: string
    headline: string | null
    skills: string[]
    extractionStatus: string
    analysisVersion: number
    analyzedAt: string | null
  }
  application: {
    id: number
    jobId: number
    jobTitle: string
    status: string
    appliedAt: string
    isDirectApplicant: boolean
    profileUrl: string
    cvDownloadUrl: string
  }
}

export interface EmployerCandidateRecommendationsResponse {
  selectedJob: EmployerRecommendedJobSummary | null
  jobs: EmployerRecommendedJobSummary[]
  recommendations: EmployerCandidateRecommendationItem[]
  emptyReason: 'NO_EMPLOYER_JOBS' | 'NO_APPLICANTS' | 'NO_MATCHING_CANDIDATES' | null
  meta: {
    pool: 'job' | 'employer'
    totalCandidates: number
    totalMatched: number
    highMatchCount: number
    aiVerifiedCount: number
    favoriteCount: number
    updatedAt: string
  }
}

export interface EmployerCandidateRecommendationQuery {
  jobId?: number
  pool?: 'job' | 'employer'
  search?: string
  minScore?: number
  status?: string
  sort?: string
}

export const getEmployerCandidateRecommendationsApi = (params: EmployerCandidateRecommendationQuery = {}) => {
  const query = new URLSearchParams()
  if (params.jobId) query.set('jobId', String(params.jobId))
  if (params.pool) query.set('pool', params.pool)
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (typeof params.minScore === 'number' && params.minScore > 0) query.set('minScore', String(params.minScore))
  if (params.status) query.set('status', params.status)
  if (params.sort) query.set('sort', params.sort)
  const qs = query.toString()
  return fetchApi<EmployerCandidateRecommendationsResponse>(`/employer/recommendations${qs ? `?${qs}` : ''}`)
}
