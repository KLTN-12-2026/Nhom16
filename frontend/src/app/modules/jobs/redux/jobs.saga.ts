import { put, select, takeEvery, takeLatest } from 'redux-saga/effects'

import type { RootState } from '../../../store'
import { JOB_ACTIONS, jobActions } from './jobs.redux'

const FAVORITES_STORAGE_KEY = 'topcv.favoriteJobIds'

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value.filter(Number.isInteger) : []
  } catch {
    return []
  }
}

function* loadFavoritesWorker() {
  yield put(jobActions.favoritesLoaded(readFavorites()))
}

function* persistFavoritesWorker() {
  const favoriteJobIds: number[] = yield select((state: RootState) => state.jobs.favoriteJobIds)
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteJobIds))
}

export function* jobsSaga() {
  yield takeLatest(JOB_ACTIONS.FAVORITES_LOAD, loadFavoritesWorker)
  yield takeEvery(JOB_ACTIONS.FAVORITE_TOGGLE, persistFavoritesWorker)
}
