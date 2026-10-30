import { createAction } from '@reduxjs/toolkit'
import type { UnknownAction } from 'redux'

export const JOB_ACTIONS = Object.freeze({
  SELECT: 'jobs/select',
  FAVORITES_LOAD: 'jobs/favorites/load',
  FAVORITES_LOADED: 'jobs/favorites/loaded',
  FAVORITE_TOGGLE: 'jobs/favorite/toggle',
})

export interface JobsState {
  selectedJobId: number | null
  favoriteJobIds: number[]
  favoritesInitialized: boolean
}

const initialState: JobsState = {
  selectedJobId: null,
  favoriteJobIds: [],
  favoritesInitialized: false,
}

export const jobActions = {
  select: createAction<number | null>(JOB_ACTIONS.SELECT),
  favoritesLoad: createAction(JOB_ACTIONS.FAVORITES_LOAD),
  favoritesLoaded: createAction<number[]>(JOB_ACTIONS.FAVORITES_LOADED),
  favoriteToggle: createAction<number>(JOB_ACTIONS.FAVORITE_TOGGLE),
}

export function jobsReducer(state: JobsState = initialState, action: UnknownAction): JobsState {
  const payload = (action as UnknownAction & { payload?: unknown }).payload
  switch (action.type) {
    case JOB_ACTIONS.SELECT:
      return { ...state, selectedJobId: payload as number | null }

    case JOB_ACTIONS.FAVORITES_LOADED:
      return { ...state, favoriteJobIds: payload as number[], favoritesInitialized: true }

    case JOB_ACTIONS.FAVORITE_TOGGLE: {
      const jobId = payload as number
      const favoriteJobIds = state.favoriteJobIds.includes(jobId)
        ? state.favoriteJobIds.filter((id) => id !== jobId)
        : [...state.favoriteJobIds, jobId]
      return { ...state, favoriteJobIds }
    }

    default:
      return state
  }
}
