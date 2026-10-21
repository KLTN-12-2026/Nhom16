import type { AuthUser, GoogleAuthPayload, LoginPayload, RegisterPayload } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const authApi = {
  register(payload: RegisterPayload) {
    return fetchApi<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  login(payload: LoginPayload) {
    return fetchApi<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  google(payload: GoogleAuthPayload) {
    return fetchApi<{ user: AuthUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  logout() {
    return fetchApi<void>('/auth/logout', { method: 'POST' })
  },
  getCurrentUser() {
    return fetchApi<{ user: AuthUser }>('/auth/me')
  },
}
