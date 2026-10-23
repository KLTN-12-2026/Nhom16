import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AuthUser, ForgotPasswordPayload, GoogleChallenge, GoogleCompletePayload, GoogleStartPayload, LoginPayload, RegisterPayload, ResendVerificationPayload, ResetPasswordPayload, VerifyEmailPayload } from '../../../model/auth.model'

interface AuthState {
  user: AuthUser | null
  initialized: boolean
  submitting: boolean
  error: string
  message: string
  googleChallenge: GoogleChallenge | null
}

const initialState: AuthState = { user: null, initialized: false, submitting: false, error: '', message: '', googleChallenge: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    bootstrapRequested(state) { state.initialized = false },
    bootstrapFinished(state, action: PayloadAction<AuthUser | null>) { state.user = action.payload; state.initialized = true },
    loginRequested(state, _action: PayloadAction<LoginPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    registerRequested(state, _action: PayloadAction<RegisterPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    googleStartRequested(state, _action: PayloadAction<GoogleStartPayload>) { state.submitting = true; state.error = ''; state.message = ''; state.googleChallenge = null },
    googleStartSucceeded(state, action: PayloadAction<GoogleChallenge>) { state.submitting = false; state.googleChallenge = action.payload; state.error = '' },
    googleCompleteRequested(state, _action: PayloadAction<GoogleCompletePayload>) { state.submitting = true; state.error = ''; state.message = '' },
    forgotPasswordRequested(state, _action: PayloadAction<ForgotPasswordPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    resetPasswordRequested(state, _action: PayloadAction<ResetPasswordPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    verifyEmailRequested(state, _action: PayloadAction<VerifyEmailPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    resendVerificationRequested(state, _action: PayloadAction<ResendVerificationPayload>) { state.submitting = true; state.error = ''; state.message = '' },
    recoverySucceeded(state, action: PayloadAction<string>) { state.submitting = false; state.error = ''; state.message = action.payload },
    authSucceeded(state, action: PayloadAction<{ user: AuthUser; message?: string }>) { state.user = action.payload.user; state.submitting = false; state.error = ''; state.message = action.payload.message || ''; state.googleChallenge = null },
    registerSucceeded(state, action: PayloadAction<string>) { state.submitting = false; state.error = ''; state.message = action.payload },
    authFailed(state, action: PayloadAction<string>) { state.submitting = false; state.error = action.payload },
    logoutRequested(state) { state.submitting = true },
    logoutFinished(state) { state.user = null; state.submitting = false; state.error = ''; state.message = '' },
    feedbackCleared(state) { state.error = ''; state.message = '' },
    googleChallengeCleared(state) { state.googleChallenge = null },
  },
})

export const authActions = authSlice.actions
export const authReducer = authSlice.reducer
