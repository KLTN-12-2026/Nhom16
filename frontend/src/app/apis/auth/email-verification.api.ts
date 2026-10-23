import type { ResendVerificationPayload, VerifyEmailPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const verifyEmailApi = (payload: VerifyEmailPayload) => fetchApi<never>('/auth/verify-email', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const resendVerificationApi = (payload: ResendVerificationPayload) => fetchApi<never>('/auth/resend-verification', {
  method: 'POST',
  body: JSON.stringify(payload),
})
