import { fetchApi, getApiUrl } from '../fetch-api'

export interface CandidateProfile {
  id?: number
  userId?: number
  avatar?: string | null
  phone?: string | null
  address?: string | null
  title?: string | null
  bio?: string | null
  skills?: string[]
  education?: unknown[]
  experience?: unknown[]
}

export interface CandidateProfileUser {
  id: number
  email: string
  fullName: string
  status: string
  emailVerifiedAt?: string | null
  lastLoginAt?: string | null
  candidateProfile?: CandidateProfile | null
}

export interface UpdateCandidateProfilePayload {
  fullName?: string
  avatar?: string | null
  phone?: string | null
  address?: string | null
  title?: string | null
  bio?: string | null
  skills?: string[]
  education?: unknown[]
  experience?: unknown[]
}

export const getCandidateProfileApi = () =>
  fetchApi<CandidateProfileUser>('/candidate/profile')

export const updateCandidateProfileApi = (payload: UpdateCandidateProfilePayload) =>
  fetchApi<CandidateProfileUser>('/candidate/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const uploadCandidateAvatarApi = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return fetchApi<CandidateProfileUser>('/candidate/profile/avatar', {
    method: 'POST',
    body,
    timeoutMs: 30000,
  })
}

export const deleteCandidateAvatarApi = () =>
  fetchApi<CandidateProfileUser>('/candidate/profile/avatar', {
    method: 'DELETE',
  })

export const getCandidateAvatarUrl = (userId?: number, timestamp?: number) =>
  getApiUrl(userId ? `/candidate/user/${userId}/avatar${timestamp ? `?t=${timestamp}` : ''}` : `/candidate/profile/avatar${timestamp ? `?t=${timestamp}` : ''}`)

