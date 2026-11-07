import { fetchApi } from '../fetch-api'
import { ApiClientError, getApiUrl } from '../fetch-api'
import type { JobData } from '../job'

export interface EmployerJobInput { categoryId: number; title: string; salaryMin?: number | null; salaryMax?: number | null; location: string; workMode: string; experienceLevel: string; employmentType: string; positionLevel: string; description: string; requirements: string[]; benefits: string[]; skills: string[]; deadline: string; publish?: boolean }
export interface ApplicationData { id: number; status: string; appliedAt: string; coverLetter?: string; job: JobData; candidate?: { id: number; fullName: string; email: string }; cv: { id: number; displayName: string; originalName?: string; headline?: string; skills?: string[] }; history?: Array<{ id: number; fromStatus: string | null; toStatus: string; note?: string | null; createdAt: string }> }

export const listEmployerJobsApi = () => fetchApi<JobData[]>('/employer/jobs')
export const getEmployerJobApi = (id: number | string) => fetchApi<JobData & { jdFiles?: Array<{ id: number; originalName: string }> }>(`/employer/jobs/${id}`)
export const createEmployerJobApi = (data: EmployerJobInput) => fetchApi<JobData>('/employer/jobs', { method: 'POST', body: JSON.stringify(data) })
export const updateEmployerJobApi = (id: number, data: EmployerJobInput) => fetchApi<JobData>(`/employer/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const changeEmployerJobStatusApi = (id: number, action: 'publish' | 'hide' | 'close') => fetchApi<JobData>(`/employer/jobs/${id}/${action}`, { method: 'POST' })
export const cloneEmployerJobApi = (id: number) => fetchApi<JobData>(`/employer/jobs/${id}/clone`, { method: 'POST' })
export const uploadJobJdApi = (id: number, file: File) => { const body = new FormData(); body.append('file', file); return fetchApi(`/employer/jobs/${id}/jd`, { method: 'POST', body }) }
export const applyToJobApi = (jobId: number, cvId: number, coverLetter?: string) => fetchApi<ApplicationData>('/candidate/applications', { method: 'POST', body: JSON.stringify({ jobId, cvId, coverLetter }) })
export const listCandidateApplicationsApi = () => fetchApi<ApplicationData[]>('/candidate/applications')
export const getCandidateApplicationJobApi = (applicationId: number | string) => fetchApi<JobData>(`/candidate/applications/${applicationId}/job`)
export const listEmployerApplicationsApi = (jobId?: number) => fetchApi<ApplicationData[]>(`/employer/applications${jobId ? `?jobId=${jobId}` : ''}`)
export const updateApplicationStatusApi = (id: number, status: string, note?: string) => fetchApi<ApplicationData>(`/employer/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) })
export const downloadApplicationCvApi = async (application: ApplicationData) => { const response = await fetch(getApiUrl(`/employer/applications/${application.id}/cv/download`), { credentials: 'include' }); if (!response.ok) throw new ApiClientError(response.status, { code: 'CV_DOWNLOAD_FAILED', message: 'Không thể tải CV ứng viên.' }); const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = application.cv.originalName || `${application.cv.displayName}.pdf`; anchor.click(); URL.revokeObjectURL(url) }
export const toggleFavoriteCandidateApi = (candidateId: number) => fetchApi<{ favorite: boolean; candidateId: number }>(`/employer/favorite-candidates/${candidateId}/toggle`, { method: 'POST' })
export interface FavoriteCandidateData { id: number; candidate: { id: number; fullName: string; email: string; candidateProfile?: { avatar?: string; phone?: string; title?: string; skills?: string[] } } }
export const listFavoriteCandidatesApi = () => fetchApi<FavoriteCandidateData[]>('/employer/favorite-candidates')
export const listFavoriteJobsApi = () => fetchApi<Array<{ id: number; job: JobData }>>('/candidate/favorite-jobs')
export const toggleFavoriteJobApi = (jobId: number) => fetchApi<{ favorite: boolean; jobId: number }>(`/candidate/favorite-jobs/${jobId}/toggle`, { method: 'POST' })
export interface NotificationData { id: number; type: string; title: string; message: string; entityType?: string; entityId?: number; readAt: string | null; createdAt: string }
export const listNotificationsApi = () => fetchApi<NotificationData[]>('/candidate/notifications')
export const markNotificationReadApi = (id: number) => fetchApi<NotificationData>(`/candidate/notifications/${id}/read`, { method: 'PATCH' })
