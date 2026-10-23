import type { AuthUser, GoogleChallenge, GoogleCompletePayload, GoogleResendPayload, GoogleStartPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const googleStartApi = (payload: GoogleStartPayload) => fetchApi<GoogleChallenge>('/auth/google/start', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const googleCompleteApi = (payload: GoogleCompletePayload) => fetchApi<{ user: AuthUser }>('/auth/google/complete', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const googleResendApi = (payload: GoogleResendPayload) => fetchApi<{ cooldownSeconds: number }>('/auth/google/resend', {
  method: 'POST',
  body: JSON.stringify(payload),
})
