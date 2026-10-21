import type { PayloadAction } from '@reduxjs/toolkit'
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'

import { getCurrentUserApi, googleAuthApi, loginApi, logoutApi, registerApi } from '../../../apis/auth'
import { ApiClientError } from '../../../apis/fetch-api'
import type { ApiResponse } from '../../../model/api.model'
import type { AuthUser, GoogleAuthPayload, LoginPayload, RegisterPayload } from '../../../model/auth.model'
import { authActions } from './auth.slice'

const errorMessage = (error: unknown) => error instanceof ApiClientError ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'

function* bootstrapWorker() {
  try {
    const response: ApiResponse<{ user: AuthUser }> = yield call(getCurrentUserApi)
    yield put(authActions.bootstrapFinished(response.data.user))
  } catch { yield put(authActions.bootstrapFinished(null)) }
}

function* loginWorker(action: PayloadAction<LoginPayload>) {
  try {
    const response: ApiResponse<{ user: AuthUser }> = yield call(loginApi, action.payload)
    yield put(authActions.authSucceeded({ user: response.data.user, message: response.message }))
  } catch (error) { yield put(authActions.authFailed(errorMessage(error))) }
}

function* registerWorker(action: PayloadAction<RegisterPayload>) {
  try {
    const response: ApiResponse<{ user: AuthUser }> = yield call(registerApi, action.payload)
    yield put(authActions.registerSucceeded(response.message || 'Đăng ký thành công. Vui lòng kiểm tra email của bạn.'))
  } catch (error) { yield put(authActions.authFailed(errorMessage(error))) }
}

function* googleWorker(action: PayloadAction<GoogleAuthPayload>) {
  try {
    const response: ApiResponse<{ user: AuthUser }> = yield call(googleAuthApi, action.payload)
    yield put(authActions.authSucceeded({ user: response.data.user, message: response.message }))
  } catch (error) { yield put(authActions.authFailed(errorMessage(error))) }
}

function* logoutWorker() {
  try { yield call(logoutApi) } finally { yield put(authActions.logoutFinished()) }
}

export function* authSaga() {
  yield takeLatest(authActions.bootstrapRequested.type, bootstrapWorker)
  yield takeLatest(authActions.loginRequested.type, loginWorker)
  yield takeLatest(authActions.registerRequested.type, registerWorker)
  yield takeLatest(authActions.googleRequested.type, googleWorker)
  yield takeEvery(authActions.logoutRequested.type, logoutWorker)
}
