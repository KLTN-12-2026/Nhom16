import { createAction } from '@reduxjs/toolkit'
import type { UnknownAction } from 'redux'
import type { AdminAuditLog, AdminDashboard, AdminJob, AdminReport, CatalogGroups, Pagination } from '../../../apis/admin/admin-management.api'

export const ADMIN_ACTIONS = Object.freeze({
  DASHBOARD_LOAD: 'admin/dashboard/load', DASHBOARD_LOADED: 'admin/dashboard/loaded',
  JOBS_LOAD: 'admin/jobs/load', JOBS_LOADED: 'admin/jobs/loaded', JOB_MODERATE: 'admin/job/moderate',
  AUDIT_LOGS_LOAD: 'admin/audit-logs/load', AUDIT_LOGS_LOADED: 'admin/audit-logs/loaded',
  CATALOGS_LOAD: 'admin/catalogs/load', CATALOGS_LOADED: 'admin/catalogs/loaded', CATALOG_CREATE: 'admin/catalog/create', CATALOG_TOGGLE: 'admin/catalog/toggle',
  REPORTS_LOAD: 'admin/reports/load', REPORTS_LOADED: 'admin/reports/loaded', REPORT_UPDATE: 'admin/report/update',
  REQUEST_STARTED: 'admin/request/started', REQUEST_SUCCEEDED: 'admin/request/succeeded', REQUEST_FAILED: 'admin/request/failed', CLEAR_MESSAGE: 'admin/message/clear',
})

export interface AdminState {
  dashboard: AdminDashboard | null; jobs: AdminJob[]; jobPagination: Pagination | null
  catalogs: CatalogGroups; reports: AdminReport[]; reportPagination: Pagination | null
  auditLogs: AdminAuditLog[]
  loading: boolean; error: string; message: string
}
const emptyCatalogs: CatalogGroups = { industries: [], skills: [], positions: [] }
const initialState: AdminState = { dashboard: null, jobs: [], jobPagination: null, catalogs: emptyCatalogs, reports: [], reportPagination: null, auditLogs: [], loading: false, error: '', message: '' }

export const adminActions = {
  dashboardLoad: createAction<{ from?: string; to?: string }>(ADMIN_ACTIONS.DASHBOARD_LOAD), dashboardLoaded: createAction<AdminDashboard>(ADMIN_ACTIONS.DASHBOARD_LOADED),
  jobsLoad: createAction<Record<string, string | number | undefined>>(ADMIN_ACTIONS.JOBS_LOAD), jobsLoaded: createAction<{ items: AdminJob[]; pagination: Pagination }>(ADMIN_ACTIONS.JOBS_LOADED),
  jobModerate: createAction<{ id: number; action: string; reason: string }>(ADMIN_ACTIONS.JOB_MODERATE),
  auditLogsLoad: createAction<Record<string, string | number | undefined>>(ADMIN_ACTIONS.AUDIT_LOGS_LOAD), auditLogsLoaded: createAction<{ items: AdminAuditLog[]; pagination: Pagination }>(ADMIN_ACTIONS.AUDIT_LOGS_LOADED),
  catalogsLoad: createAction(ADMIN_ACTIONS.CATALOGS_LOAD), catalogsLoaded: createAction<CatalogGroups>(ADMIN_ACTIONS.CATALOGS_LOADED),
  catalogCreate: createAction<{ type: string; name: string; code?: string; legalReference?: string }>(ADMIN_ACTIONS.CATALOG_CREATE),
  catalogToggle: createAction<{ type: string; id: number; active: boolean }>(ADMIN_ACTIONS.CATALOG_TOGGLE),
  reportsLoad: createAction<Record<string, string | number | undefined>>(ADMIN_ACTIONS.REPORTS_LOAD), reportsLoaded: createAction<{ items: AdminReport[]; pagination: Pagination }>(ADMIN_ACTIONS.REPORTS_LOADED),
  reportUpdate: createAction<{ id: number; status: string; resolution: string; actionTaken?: string }>(ADMIN_ACTIONS.REPORT_UPDATE),
  requestStarted: createAction(ADMIN_ACTIONS.REQUEST_STARTED), requestSucceeded: createAction<string>(ADMIN_ACTIONS.REQUEST_SUCCEEDED), requestFailed: createAction<string>(ADMIN_ACTIONS.REQUEST_FAILED), clearMessage: createAction(ADMIN_ACTIONS.CLEAR_MESSAGE),
}

export function adminReducer(state: AdminState = initialState, action: UnknownAction): AdminState {
  const payload = (action as UnknownAction & { payload?: unknown }).payload
  switch (action.type) {
    case ADMIN_ACTIONS.REQUEST_STARTED: return { ...state, loading: true, error: '', message: '' }
    case ADMIN_ACTIONS.REQUEST_SUCCEEDED: return { ...state, loading: false, message: payload as string }
    case ADMIN_ACTIONS.REQUEST_FAILED: return { ...state, loading: false, error: payload as string }
    case ADMIN_ACTIONS.CLEAR_MESSAGE: return { ...state, error: '', message: '' }
    case ADMIN_ACTIONS.DASHBOARD_LOADED: return { ...state, dashboard: payload as AdminDashboard, loading: false }
    case ADMIN_ACTIONS.JOBS_LOADED: { const data = payload as { items: AdminJob[]; pagination: Pagination }; return { ...state, jobs: data.items, jobPagination: data.pagination, loading: false } }
    case ADMIN_ACTIONS.AUDIT_LOGS_LOADED: { const data = payload as { items: AdminAuditLog[] }; return { ...state, auditLogs: data.items, loading: false } }
    case ADMIN_ACTIONS.CATALOGS_LOADED: return { ...state, catalogs: payload as CatalogGroups, loading: false }
    case ADMIN_ACTIONS.REPORTS_LOADED: { const data = payload as { items: AdminReport[]; pagination: Pagination }; return { ...state, reports: data.items, reportPagination: data.pagination, loading: false } }
    default: return state
  }
}
