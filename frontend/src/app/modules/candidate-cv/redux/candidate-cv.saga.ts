import { call, put, takeLatest } from 'redux-saga/effects'

import { assessCandidateCvQualityApi } from '../../../apis/candidate'
import { ApiClientError } from '../../../apis/fetch-api'
import { CANDIDATE_CV_ACTIONS, candidateCvActions } from './candidate-cv.redux'

function* assessQualityWorker(action: ReturnType<typeof candidateCvActions.qualityRequested>) {
  try {
    const response: Awaited<ReturnType<typeof assessCandidateCvQualityApi>> = yield call(
      assessCandidateCvQualityApi,
      action.payload.cvId,
      Boolean(action.payload.force),
    )
    yield put(candidateCvActions.qualitySucceeded({ cvId: action.payload.cvId, assessment: response.data.assessment }))
  } catch (cause) {
    const message = cause instanceof ApiClientError ? cause.message : 'Không thể đánh giá chất lượng CV.'
    yield put(candidateCvActions.qualityFailed({ cvId: action.payload.cvId, message }))
  }
}

export function* candidateCvSaga() {
  yield takeLatest(CANDIDATE_CV_ACTIONS.QUALITY_REQUESTED, assessQualityWorker)
}
