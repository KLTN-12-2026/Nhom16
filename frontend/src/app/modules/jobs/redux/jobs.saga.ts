import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'

import { listFavoriteJobsApi, toggleFavoriteJobApi } from '../../../apis/recruitment'
import { JOB_ACTIONS, jobActions } from './jobs.redux'

function* loadFavoritesWorker() {
  try {
    const response: Awaited<ReturnType<typeof listFavoriteJobsApi>> = yield call(listFavoriteJobsApi)
    yield put(jobActions.favoritesLoaded(response.data.map(item => item.job.id)))
  } catch {
    yield put(jobActions.favoritesLoaded([]))
  }
}

function* persistFavoritesWorker(action: ReturnType<typeof jobActions.favoriteToggle>) {
  try { yield call(toggleFavoriteJobApi, action.payload) } catch { yield put(jobActions.favoriteRollback(action.payload)) }
}

export function* jobsSaga() {
  yield takeLatest(JOB_ACTIONS.FAVORITES_LOAD, loadFavoritesWorker)
  yield takeEvery(JOB_ACTIONS.FAVORITE_TOGGLE, persistFavoritesWorker)
}
