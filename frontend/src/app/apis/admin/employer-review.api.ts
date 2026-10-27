import { fetchApi } from '../fetch-api'

export interface PendingEmployer {
  id: number
  companyName: string
  taxCode: string
  businessLicenseNumber: string
  companyPhone: string
  companyAddress: string
  companyWebsite: string | null
  representativeName: string
  representativePosition: string
  createdAt: string
  email: string
  accountName: string
  emailVerified: boolean
}

export const getPendingEmployersApi = () => fetchApi<{ profiles: PendingEmployer[] }>('/admin/employers/pending')

export const reviewEmployerApi = (id: number, decision: 'APPROVE' | 'REJECT', reason = '') => fetchApi<{ id: number; verificationStatus: string }>(`/admin/employers/${id}/review`, {
  method: 'POST',
  body: JSON.stringify({ decision, reason }),
})
