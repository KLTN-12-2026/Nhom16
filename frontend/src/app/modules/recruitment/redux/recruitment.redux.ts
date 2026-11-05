import { createAction } from '@reduxjs/toolkit'
import type { UnknownAction } from 'redux'
import type { JobData } from '../../../apis/job'
import type { ApplicationData } from '../../../apis/recruitment'

export const RECRUITMENT_ACTIONS = Object.freeze({
  EMPLOYER_JOBS_LOAD: 'recruitment/employerJobs/load', EMPLOYER_JOBS_LOADED: 'recruitment/employerJobs/loaded',
  EMPLOYER_APPLICATIONS_LOAD: 'recruitment/employerApplications/load', EMPLOYER_APPLICATIONS_LOADED: 'recruitment/employerApplications/loaded',
  CANDIDATE_APPLICATIONS_LOAD: 'recruitment/candidateApplications/load', CANDIDATE_APPLICATIONS_LOADED: 'recruitment/candidateApplications/loaded',
  SAVED_JOBS_LOAD: 'recruitment/savedJobs/load', SAVED_JOBS_LOADED: 'recruitment/savedJobs/loaded',
  FAILED: 'recruitment/failed',
})

interface RecruitmentState { employerJobs: JobData[]; employerApplications: ApplicationData[]; candidateApplications: ApplicationData[]; savedJobs: JobData[]; loading: boolean; error: string }
const initialState: RecruitmentState = { employerJobs: [], employerApplications: [], candidateApplications: [], savedJobs: [], loading: false, error: '' }
export const recruitmentActions = {
  employerJobsLoad: createAction(RECRUITMENT_ACTIONS.EMPLOYER_JOBS_LOAD), employerJobsLoaded: createAction<JobData[]>(RECRUITMENT_ACTIONS.EMPLOYER_JOBS_LOADED),
  employerApplicationsLoad: createAction(RECRUITMENT_ACTIONS.EMPLOYER_APPLICATIONS_LOAD), employerApplicationsLoaded: createAction<ApplicationData[]>(RECRUITMENT_ACTIONS.EMPLOYER_APPLICATIONS_LOADED),
  candidateApplicationsLoad: createAction(RECRUITMENT_ACTIONS.CANDIDATE_APPLICATIONS_LOAD), candidateApplicationsLoaded: createAction<ApplicationData[]>(RECRUITMENT_ACTIONS.CANDIDATE_APPLICATIONS_LOADED),
  savedJobsLoad: createAction(RECRUITMENT_ACTIONS.SAVED_JOBS_LOAD), savedJobsLoaded: createAction<JobData[]>(RECRUITMENT_ACTIONS.SAVED_JOBS_LOADED),
  failed: createAction<string>(RECRUITMENT_ACTIONS.FAILED),
}

export function recruitmentReducer(state = initialState, action: UnknownAction): RecruitmentState {
  const payload = (action as UnknownAction & { payload?: unknown }).payload
  switch (action.type) {
    case RECRUITMENT_ACTIONS.EMPLOYER_JOBS_LOAD:
    case RECRUITMENT_ACTIONS.EMPLOYER_APPLICATIONS_LOAD:
    case RECRUITMENT_ACTIONS.CANDIDATE_APPLICATIONS_LOAD:
    case RECRUITMENT_ACTIONS.SAVED_JOBS_LOAD: return { ...state, loading: true, error: '' }
    case RECRUITMENT_ACTIONS.EMPLOYER_JOBS_LOADED: return { ...state, employerJobs: payload as JobData[], loading: false }
    case RECRUITMENT_ACTIONS.EMPLOYER_APPLICATIONS_LOADED: return { ...state, employerApplications: payload as ApplicationData[], loading: false }
    case RECRUITMENT_ACTIONS.CANDIDATE_APPLICATIONS_LOADED: return { ...state, candidateApplications: payload as ApplicationData[], loading: false }
    case RECRUITMENT_ACTIONS.SAVED_JOBS_LOADED: return { ...state, savedJobs: payload as JobData[], loading: false }
    case RECRUITMENT_ACTIONS.FAILED: return { ...state, loading: false, error: payload as string }
    default: return state
  }
}
