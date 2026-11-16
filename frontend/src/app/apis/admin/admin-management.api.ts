import { fetchApi } from '../fetch-api/fetchApi'

export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface AdminDashboard {
  totals: { users: number; employers: number; jobs: number; applications: number }
  breakdowns: Record<'users' | 'jobs' | 'applications', Record<string, number>>
  period: { from: string | null; to: string | null }
  updatedAt: string
}
export interface AdminJob {
  id: number; title: string; company: string; location: string; status: string
  isPublic: boolean; isHidden: boolean; createdAt: string
  category?: { name: string }; employerProfile?: { companyName: string; verificationStatus: string }
}
export interface CatalogItem { id: number; code?: string; name: string; type?: string; active: boolean; legalReference?: string }
export interface CatalogGroups { industries: CatalogItem[]; skills: CatalogItem[]; positions: CatalogItem[] }
export interface AdminReport {
  id: number; reportType: string; content: string; entityType?: string; entityId?: number
  status: string; resolution?: string; actionTaken?: string; createdAt: string; handledAt?: string
}
export interface AdminAuditLog {
  id: number; action: string; entityType: string; entityId?: number; reason?: string
  metadata?: Record<string, unknown>; createdAt: string
}

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => value !== undefined && value !== '' && search.set(key, String(value)))
  return search.toString() ? `?${search}` : ''
}

export const getAdminDashboardApi = (filters: { from?: string; to?: string }) =>
  fetchApi<AdminDashboard>(`/admin/metrics${query(filters)}`).then((response) => response.data)

export const listAdminJobsApi = (filters: Record<string, string | number | undefined>) =>
  fetchApi<{ items: AdminJob[]; pagination: Pagination }>(`/admin/jobs${query(filters)}`).then((response) => response.data)

export const moderateAdminJobApi = (payload: { id: number; action: string; reason: string }) =>
  fetchApi<AdminJob>(`/admin/jobs/${payload.id}/moderation`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data)
export const listAdminAuditLogsApi = (filters: Record<string, string | number | undefined>) =>
  fetchApi<{ items: AdminAuditLog[]; pagination: Pagination }>(`/admin/audit-logs${query(filters)}`).then((response) => response.data)

export const listAdminCatalogsApi = () => fetchApi<CatalogGroups>('/admin/catalogs').then((response) => response.data)
export const createAdminCatalogApi = (payload: { type: string; name: string; code?: string; legalReference?: string }) =>
  fetchApi<CatalogItem>('/admin/catalogs', { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data)
export const toggleAdminCatalogApi = (payload: { type: string; id: number; active: boolean }) =>
  fetchApi<CatalogItem>(`/admin/catalogs/${payload.type}/${payload.id}`, { method: 'PATCH', body: JSON.stringify({ active: payload.active }) }).then((response) => response.data)

export const listAdminReportsApi = (filters: Record<string, string | number | undefined>) =>
  fetchApi<{ items: AdminReport[]; pagination: Pagination }>(`/admin/reports${query(filters)}`).then((response) => response.data)
export const resolveAdminReportApi = (payload: { id: number; status: string; resolution: string; actionTaken?: string }) =>
  fetchApi<AdminReport>(`/admin/reports/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data)
