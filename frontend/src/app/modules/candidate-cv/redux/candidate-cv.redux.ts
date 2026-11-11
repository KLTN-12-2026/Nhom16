import { createAction } from '@reduxjs/toolkit'
import type { UnknownAction } from 'redux'

import type { CvQualityAssessment } from '../../../apis/candidate'

export const CANDIDATE_CV_ACTIONS = Object.freeze({
  QUALITY_REQUESTED: 'candidateCv/quality/requested',
  QUALITY_SUCCEEDED: 'candidateCv/quality/succeeded',
  QUALITY_FAILED: 'candidateCv/quality/failed',
})

interface CandidateCvState {
  assessmentByCvId: Record<number, CvQualityAssessment>
  errorByCvId: Record<number, string>
  assessingCvId: number | null
}

const initialState: CandidateCvState = { assessmentByCvId: {}, errorByCvId: {}, assessingCvId: null }

export const candidateCvActions = {
  qualityRequested: createAction<{ cvId: number; force?: boolean }>(CANDIDATE_CV_ACTIONS.QUALITY_REQUESTED),
  qualitySucceeded: createAction<{ cvId: number; assessment: CvQualityAssessment }>(CANDIDATE_CV_ACTIONS.QUALITY_SUCCEEDED),
  qualityFailed: createAction<{ cvId: number; message: string }>(CANDIDATE_CV_ACTIONS.QUALITY_FAILED),
}

export function candidateCvReducer(state = initialState, action: UnknownAction): CandidateCvState {
  const payload = (action as UnknownAction & { payload?: unknown }).payload
  switch (action.type) {
    case CANDIDATE_CV_ACTIONS.QUALITY_REQUESTED:
      return {
        ...state,
        assessingCvId: (payload as { cvId: number }).cvId,
        errorByCvId: { ...state.errorByCvId, [(payload as { cvId: number }).cvId]: '' },
      }
    case CANDIDATE_CV_ACTIONS.QUALITY_SUCCEEDED: {
      const result = payload as { cvId: number; assessment: CvQualityAssessment }
      return { ...state, assessingCvId: null, assessmentByCvId: { ...state.assessmentByCvId, [result.cvId]: result.assessment } }
    }
    case CANDIDATE_CV_ACTIONS.QUALITY_FAILED: {
      const result = payload as { cvId: number; message: string }
      return { ...state, assessingCvId: null, errorByCvId: { ...state.errorByCvId, [result.cvId]: result.message } }
    }
    default:
      return state
  }
}
