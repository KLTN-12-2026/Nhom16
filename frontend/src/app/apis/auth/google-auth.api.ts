import type { AuthUser, GoogleAuthPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const googleAuthApi = (payload: GoogleAuthPayload) => fetchApi<{ user: AuthUser }>('/auth/google', {
  method: 'POST',
  body: JSON.stringify(payload),
})
