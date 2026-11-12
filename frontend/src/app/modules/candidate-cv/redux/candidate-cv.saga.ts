import { call, delay, put, takeLatest } from 'redux-saga/effects'

import {
  assessCandidateCvQualityApi,
  getCandidateCvImprovementStatusApi,
  suggestCandidateCvImprovementApi,
} from '../../../apis/candidate'
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

function* suggestImprovementWorker(action: ReturnType<typeof candidateCvActions.improvementRequested>) {
  try {
    const response: Awaited<ReturnType<typeof suggestCandidateCvImprovementApi>> = yield call(
      suggestCandidateCvImprovementApi,
      action.payload.cvId,
      Boolean(action.payload.force),
      action.payload.customRequest || '',
    )
    if (response.data.suggestion) {
      yield put(candidateCvActions.improvementSucceeded({
        cvId: action.payload.cvId,
        suggestion: response.data.suggestion,
      }))
      return
    }

    const jobId = response.data.jobId
    if (!jobId) {
      throw new Error('Missing improvement jobId')
    }

    for (let attempt = 0; attempt < 90; attempt += 1) {
      yield delay(2000)
      const statusResponse: Awaited<ReturnType<typeof getCandidateCvImprovementStatusApi>> = yield call(
        getCandidateCvImprovementStatusApi,
        action.payload.cvId,
        jobId,
      )
      if (statusResponse.data.status === 'completed' && statusResponse.data.suggestion) {
        yield put(candidateCvActions.improvementSucceeded({
          cvId: action.payload.cvId,
          suggestion: statusResponse.data.suggestion,
        }))
        return
      }
    }

    yield put(candidateCvActions.improvementFailed({
      cvId: action.payload.cvId,
      message: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
    }))
  } catch (cause) {
    const message = cause instanceof ApiClientError ? cause.message : 'Hệ thống AI đang bận, vui lòng thử lại sau.'
    yield put(candidateCvActions.improvementFailed({ cvId: action.payload.cvId, message }))
  }
}

export function* candidateCvSaga() {
  yield takeLatest(CANDIDATE_CV_ACTIONS.QUALITY_REQUESTED, assessQualityWorker)
  yield takeLatest(CANDIDATE_CV_ACTIONS.IMPROVEMENT_REQUESTED, suggestImprovementWorker)
}
