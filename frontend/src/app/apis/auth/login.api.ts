import type { AuthUser, LoginPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const loginApi = (payload: LoginPayload) => fetchApi<{ user: AuthUser }>('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
})
