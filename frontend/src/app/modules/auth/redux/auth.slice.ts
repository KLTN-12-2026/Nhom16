import { createAction } from '@reduxjs/toolkit'
import type { UnknownAction } from 'redux'

import type { AuthUser, ForgotPasswordPayload, GoogleChallenge, GoogleCompletePayload, GoogleResendPayload, GoogleStartPayload, LoginPayload, RegisterPayload, ResendVerificationPayload, ResetPasswordPayload, VerifyEmailPayload } from '../../../model/auth.model'

export const AUTH_ACTIONS = Object.freeze({
  BOOTSTRAP_REQUESTED: 'auth/bootstrapRequested', BOOTSTRAP_FINISHED: 'auth/bootstrapFinished', LOGIN_REQUESTED: 'auth/loginRequested', REGISTER_REQUESTED: 'auth/registerRequested',
  GOOGLE_START_REQUESTED: 'auth/googleStartRequested', GOOGLE_START_SUCCEEDED: 'auth/googleStartSucceeded', GOOGLE_COMPLETE_REQUESTED: 'auth/googleCompleteRequested', GOOGLE_RESEND_REQUESTED: 'auth/googleResendRequested', GOOGLE_RESEND_SUCCEEDED: 'auth/googleResendSucceeded',
  FORGOT_PASSWORD_REQUESTED: 'auth/forgotPasswordRequested', RESET_PASSWORD_REQUESTED: 'auth/resetPasswordRequested', VERIFY_EMAIL_REQUESTED: 'auth/verifyEmailRequested', RESEND_VERIFICATION_REQUESTED: 'auth/resendVerificationRequested', RECOVERY_SUCCEEDED: 'auth/recoverySucceeded',
  AUTH_SUCCEEDED: 'auth/authSucceeded', REGISTER_SUCCEEDED: 'auth/registerSucceeded', AUTH_FAILED: 'auth/authFailed', LOGOUT_REQUESTED: 'auth/logoutRequested', LOGOUT_FINISHED: 'auth/logoutFinished', FEEDBACK_CLEARED: 'auth/feedbackCleared', GOOGLE_CHALLENGE_CLEARED: 'auth/googleChallengeCleared',
})

export interface AuthState { user: AuthUser | null; initialized: boolean; submitting: boolean; error: string; message: string; googleChallenge: GoogleChallenge | null }
const initialState: AuthState = { user: null, initialized: false, submitting: false, error: '', message: '', googleChallenge: null }

export const authActions = {
  bootstrapRequested: createAction(AUTH_ACTIONS.BOOTSTRAP_REQUESTED), bootstrapFinished: createAction<AuthUser | null>(AUTH_ACTIONS.BOOTSTRAP_FINISHED),
  loginRequested: createAction<LoginPayload>(AUTH_ACTIONS.LOGIN_REQUESTED), registerRequested: createAction<RegisterPayload>(AUTH_ACTIONS.REGISTER_REQUESTED),
  googleStartRequested: createAction<GoogleStartPayload>(AUTH_ACTIONS.GOOGLE_START_REQUESTED), googleStartSucceeded: createAction<GoogleChallenge>(AUTH_ACTIONS.GOOGLE_START_SUCCEEDED), googleCompleteRequested: createAction<GoogleCompletePayload>(AUTH_ACTIONS.GOOGLE_COMPLETE_REQUESTED), googleResendRequested: createAction<GoogleResendPayload>(AUTH_ACTIONS.GOOGLE_RESEND_REQUESTED), googleResendSucceeded: createAction<string>(AUTH_ACTIONS.GOOGLE_RESEND_SUCCEEDED),
  forgotPasswordRequested: createAction<ForgotPasswordPayload>(AUTH_ACTIONS.FORGOT_PASSWORD_REQUESTED), resetPasswordRequested: createAction<ResetPasswordPayload>(AUTH_ACTIONS.RESET_PASSWORD_REQUESTED), verifyEmailRequested: createAction<VerifyEmailPayload>(AUTH_ACTIONS.VERIFY_EMAIL_REQUESTED), resendVerificationRequested: createAction<ResendVerificationPayload>(AUTH_ACTIONS.RESEND_VERIFICATION_REQUESTED), recoverySucceeded: createAction<string>(AUTH_ACTIONS.RECOVERY_SUCCEEDED),
  authSucceeded: createAction<{ user: AuthUser; message?: string }>(AUTH_ACTIONS.AUTH_SUCCEEDED), registerSucceeded: createAction<string>(AUTH_ACTIONS.REGISTER_SUCCEEDED), authFailed: createAction<string>(AUTH_ACTIONS.AUTH_FAILED),
  logoutRequested: createAction(AUTH_ACTIONS.LOGOUT_REQUESTED), logoutFinished: createAction(AUTH_ACTIONS.LOGOUT_FINISHED), feedbackCleared: createAction(AUTH_ACTIONS.FEEDBACK_CLEARED), googleChallengeCleared: createAction(AUTH_ACTIONS.GOOGLE_CHALLENGE_CLEARED),
}

export function authReducer(state: AuthState = initialState, action: UnknownAction): AuthState {
  const payload = (action as UnknownAction & { payload?: unknown }).payload
  switch (action.type) {
    case AUTH_ACTIONS.BOOTSTRAP_REQUESTED: return { ...state, initialized: false }
    case AUTH_ACTIONS.BOOTSTRAP_FINISHED: return { ...state, user: payload as AuthUser | null, initialized: true }
    case AUTH_ACTIONS.LOGIN_REQUESTED: case AUTH_ACTIONS.REGISTER_REQUESTED: case AUTH_ACTIONS.GOOGLE_COMPLETE_REQUESTED: case AUTH_ACTIONS.GOOGLE_RESEND_REQUESTED: case AUTH_ACTIONS.FORGOT_PASSWORD_REQUESTED: case AUTH_ACTIONS.RESET_PASSWORD_REQUESTED: case AUTH_ACTIONS.VERIFY_EMAIL_REQUESTED: case AUTH_ACTIONS.RESEND_VERIFICATION_REQUESTED:
      return { ...state, submitting: true, error: '', message: '' }
    case AUTH_ACTIONS.GOOGLE_START_REQUESTED: return { ...state, submitting: true, error: '', message: '', googleChallenge: null }
    case AUTH_ACTIONS.GOOGLE_START_SUCCEEDED: return { ...state, submitting: false, googleChallenge: payload as GoogleChallenge, error: '' }
    case AUTH_ACTIONS.GOOGLE_RESEND_SUCCEEDED: case AUTH_ACTIONS.RECOVERY_SUCCEEDED: case AUTH_ACTIONS.REGISTER_SUCCEEDED:
      return { ...state, submitting: false, error: '', message: payload as string }
    case AUTH_ACTIONS.AUTH_SUCCEEDED: {
      const authPayload = payload as { user: AuthUser; message?: string }
      return { ...state, user: authPayload.user, submitting: false, error: '', message: authPayload.message || '', googleChallenge: null }
    }
    case AUTH_ACTIONS.AUTH_FAILED: return { ...state, submitting: false, error: payload as string }
    case AUTH_ACTIONS.LOGOUT_REQUESTED: return { ...state, submitting: true }
    case AUTH_ACTIONS.LOGOUT_FINISHED: return { ...state, user: null, submitting: false, error: '', message: '' }
    case AUTH_ACTIONS.FEEDBACK_CLEARED: return { ...state, error: '', message: '' }
    case AUTH_ACTIONS.GOOGLE_CHALLENGE_CLEARED: return { ...state, googleChallenge: null }
    default: return state
  }
}
