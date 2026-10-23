import type { ForgotPasswordPayload, ResetPasswordPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const forgotPasswordApi = (payload: ForgotPasswordPayload) => fetchApi<never>('/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const resetPasswordApi = (payload: ResetPasswordPayload) => fetchApi<never>('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify(payload),
})
