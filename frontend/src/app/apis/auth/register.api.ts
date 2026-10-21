import type { AuthUser, RegisterPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const registerApi = (payload: RegisterPayload) => fetchApi<{ user: AuthUser }>('/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload),
})
