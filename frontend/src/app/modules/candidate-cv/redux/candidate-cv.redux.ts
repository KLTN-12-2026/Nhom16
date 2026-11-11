import { createAction } from '@reduxjs/toolkit'
import type { UnknownAction } from 'redux'

import type { CvImprovementSuggestion, CvQualityAssessment } from '../../../apis/candidate'

export const CANDIDATE_CV_ACTIONS = Object.freeze({
  QUALITY_REQUESTED: 'candidateCv/quality/requested',
  QUALITY_SUCCEEDED: 'candidateCv/quality/succeeded',
  QUALITY_FAILED: 'candidateCv/quality/failed',
  IMPROVEMENT_REQUESTED: 'candidateCv/improvement/requested',
  IMPROVEMENT_SUCCEEDED: 'candidateCv/improvement/succeeded',
  IMPROVEMENT_FAILED: 'candidateCv/improvement/failed',
})

interface CandidateCvState {
  assessmentByCvId: Record<number, CvQualityAssessment>
  errorByCvId: Record<number, string>
  assessingCvId: number | null
  suggestionByCvId: Record<number, CvImprovementSuggestion>
  suggestionErrorByCvId: Record<number, string>
  suggestingCvId: number | null
}

const initialState: CandidateCvState = {
  assessmentByCvId: {},
  errorByCvId: {},
  assessingCvId: null,
  suggestionByCvId: {},
  suggestionErrorByCvId: {},
  suggestingCvId: null,
}

export const candidateCvActions = {
  qualityRequested: createAction<{ cvId: number; force?: boolean }>(CANDIDATE_CV_ACTIONS.QUALITY_REQUESTED),
  qualitySucceeded: createAction<{ cvId: number; assessment: CvQualityAssessment }>(CANDIDATE_CV_ACTIONS.QUALITY_SUCCEEDED),
  qualityFailed: createAction<{ cvId: number; message: string }>(CANDIDATE_CV_ACTIONS.QUALITY_FAILED),
  improvementRequested: createAction<{ cvId: number; force?: boolean; customRequest?: string }>(CANDIDATE_CV_ACTIONS.IMPROVEMENT_REQUESTED),
  improvementSucceeded: createAction<{ cvId: number; suggestion: CvImprovementSuggestion }>(CANDIDATE_CV_ACTIONS.IMPROVEMENT_SUCCEEDED),
  improvementFailed: createAction<{ cvId: number; message: string }>(CANDIDATE_CV_ACTIONS.IMPROVEMENT_FAILED),
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
    case CANDIDATE_CV_ACTIONS.IMPROVEMENT_REQUESTED:
      return {
        ...state,
        suggestingCvId: (payload as { cvId: number }).cvId,
        suggestionErrorByCvId: { ...state.suggestionErrorByCvId, [(payload as { cvId: number }).cvId]: '' },
      }
    case CANDIDATE_CV_ACTIONS.IMPROVEMENT_SUCCEEDED: {
      const result = payload as { cvId: number; suggestion: CvImprovementSuggestion }
      return { ...state, suggestingCvId: null, suggestionByCvId: { ...state.suggestionByCvId, [result.cvId]: result.suggestion } }
    }
    case CANDIDATE_CV_ACTIONS.IMPROVEMENT_FAILED: {
      const result = payload as { cvId: number; message: string }
      return { ...state, suggestingCvId: null, suggestionErrorByCvId: { ...state.suggestionErrorByCvId, [result.cvId]: result.message } }
    }
    default:
      return state
  }
}
