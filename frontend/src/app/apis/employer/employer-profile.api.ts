import { fetchApi, getApiUrl } from '../fetch-api'

export interface EmployerProfile {
  id?: number
  userId?: number
  companyName: string
  logo?: string | null
  taxCode: string
  businessLicenseNumber: string
  companyPhone: string
  companyAddress: string
  companyWebsite?: string | null
  companySize?: string | null
  description?: string | null
  representativeName: string
  representativePosition: string
  verificationStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'
  verifiedAt?: string | null
  createdAt?: string
  updatedAt?: string
  user?: {
    id: number
    email: string
    fullName: string
    status: string
  }
}

export interface UpdateEmployerProfilePayload {
  companyName?: string
  logo?: string | null
  companyPhone?: string
  companyAddress?: string
  companyWebsite?: string | null
  companySize?: string | null
  description?: string | null
  representativeName?: string
  representativePosition?: string
}

export const getEmployerProfileApi = () =>
  fetchApi<EmployerProfile>('/employer/profile')

export const updateEmployerProfileApi = (payload: UpdateEmployerProfilePayload) =>
  fetchApi<EmployerProfile>('/employer/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const uploadEmployerLogoApi = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return fetchApi<EmployerProfile>('/employer/profile/logo', {
    method: 'POST',
    body,
    timeoutMs: 30000,
  })
}

export const deleteEmployerLogoApi = () =>
  fetchApi<EmployerProfile>('/employer/profile/logo', {
    method: 'DELETE',
  })

export const getEmployerLogoUrl = (userId?: number, timestamp?: number) => {
  if (userId) {
    return getApiUrl(`/employer/user/${userId}/logo${timestamp ? `?t=${timestamp}` : ''}`)
  }
  return getApiUrl(`/employer/profile/logo${timestamp ? `?t=${timestamp}` : ''}`)
}

