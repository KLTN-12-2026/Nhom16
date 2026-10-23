import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AuthUser, ForgotPasswordPayload, GoogleAuthPayload, LoginPayload, RegisterPayload, ResendVerificationPayload, ResetPasswordPayload, VerifyEmailPayload } from '../../../model/auth.model'

interface AuthState {
  user: AuthUser | null
  initialized: boolean
  submitting: boolean
  error: string
  message: string
}

const initialState: AuthState = { user: null, initialized: false, submitting: false, error: '', message: '' }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    bootstrapRequested(state) { state.initialized = false },
    bootstrapFinished(state, action: PayloadAction<AuthUser | null>) { state.user = action.payload; state.initialized = true },
    loginRequested(state, _action: PayloadAction<LoginPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    registerRequested(state, _action: PayloadAction<RegisterPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    googleRequested(state, _action: PayloadAction<GoogleAuthPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    forgotPasswordRequested(state, _action: PayloadAction<ForgotPasswordPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    resetPasswordRequested(state, _action: PayloadAction<ResetPasswordPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    verifyEmailRequested(state, _action: PayloadAction<VerifyEmailPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    resendVerificationRequested(state, _action: PayloadAction<ResendVerificationPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    recoverySucceeded(state, action: PayloadAction<string>) { state.submitting = false; state.error = ''; state.message = action.payload },
    authSucceeded(state, action: PayloadAction<{ user: AuthUser; message?: string }>) { state.user = action.payload.user; state.submitting = false; state.error = ''; state.message = action.payload.message || '' },
    registerSucceeded(state, action: PayloadAction<string>) { state.submitting = false; state.error = ''; state.message = action.payload },
    authFailed(state, action: PayloadAction<string>) { state.submitting = false; state.error = action.payload },
    logoutRequested(state) { state.submitting = true },
    logoutFinished(state) { state.user = null; state.submitting = false; state.error = ''; state.message = '' },
    feedbackCleared(state) { state.error = ''; state.message = '' },
  },
})

export const authActions = authSlice.actions
export const authReducer = authSlice.reducer
