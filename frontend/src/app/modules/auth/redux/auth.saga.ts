import type { PayloadAction } from '@reduxjs/toolkit'
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'

import { forgotPasswordApi, getCurrentUserApi, googleAuthApi, loginApi, logoutApi, registerApi, resendVerificationApi, resetPasswordApi, verifyEmailApi } from '../../../apis/auth'
import { ApiClientError } from '../../../apis/fetch-api'
import type { ApiResponse } from '../../../model/api.model'
import type { AuthUser, ForgotPasswordPayload, GoogleAuthPayload, LoginPayload, RegisterPayload, ResendVerificationPayload, ResetPasswordPayload, VerifyEmailPayload } from '../../../model/auth.model'
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

function* forgotPasswordWorker(action: PayloadAction<ForgotPasswordPayload>) {
  try {
    const response: ApiResponse<never> = yield call(forgotPasswordApi, action.payload)
    yield put(authActions.recoverySucceeded(response.message || 'Nếu email tồn tại, hướng dẫn sẽ được gửi trong ít phút.'))
  } catch (error) { yield put(authActions.authFailed(errorMessage(error))) }
}

function* resetPasswordWorker(action: PayloadAction<ResetPasswordPayload>) {
  try {
    const response: ApiResponse<never> = yield call(resetPasswordApi, action.payload)
    yield put(authActions.recoverySucceeded(response.message || 'Đặt lại mật khẩu thành công.'))
  } catch (error) { yield put(authActions.authFailed(errorMessage(error))) }
}

function* verifyEmailWorker(action: PayloadAction<VerifyEmailPayload>) {
  try {
    const response: ApiResponse<never> = yield call(verifyEmailApi, action.payload)
    yield put(authActions.recoverySucceeded(response.message || 'Xác minh email thành công.'))
  } catch (error) { yield put(authActions.authFailed(errorMessage(error))) }
}

function* resendVerificationWorker(action: PayloadAction<ResendVerificationPayload>) {
  try {
    const response: ApiResponse<never> = yield call(resendVerificationApi, action.payload)
    yield put(authActions.recoverySucceeded(response.message || 'Email xác minh đã được gửi lại.'))
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
  yield takeLatest(authActions.forgotPasswordRequested.type, forgotPasswordWorker)
  yield takeLatest(authActions.resetPasswordRequested.type, resetPasswordWorker)
  yield takeLatest(authActions.verifyEmailRequested.type, verifyEmailWorker)
  yield takeLatest(authActions.resendVerificationRequested.type, resendVerificationWorker)
  yield takeEvery(authActions.logoutRequested.type, logoutWorker)
}
