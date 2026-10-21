import type { AuthUser } from '../../model/auth.model'
import { fetchApi } from '../fetch-api'

export const getCurrentUserApi = () => fetchApi<{ user: AuthUser }>('/auth/me')
export const logoutApi = () => fetchApi<void>('/auth/logout', { method: 'POST' })
