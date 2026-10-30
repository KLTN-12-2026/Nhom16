import { ApiClientError, fetchApi, getApiUrl } from '../fetch-api'

export interface CandidateCv {
  id: number
  displayName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  isDefault: boolean
  candidateName: string | null
  candidateEmail: string | null
  candidatePhone: string | null
  headline: string | null
  hasAvatar: boolean
  extractionStatus: 'pending' | 'processing' | 'completed' | 'partial' | 'failed'
  createdAt: string
  updatedAt: string
}

export const listCandidateCvsApi = () => fetchApi<{ cvs: CandidateCv[] }>('/candidate/cvs')

export const getCandidateCvAvatarUrl = (id: number) => getApiUrl(`/candidate/cvs/${id}/avatar`)

export const uploadCandidateCvApi = (file: File, displayName: string) => {
  const body = new FormData()
  body.append('file', file)
  if (displayName.trim()) body.append('displayName', displayName.trim())
  return fetchApi<{ cv: CandidateCv }>('/candidate/cvs', { method: 'POST', body, timeoutMs: 30000 })
}

export const renameCandidateCvApi = (id: number, displayName: string) => fetchApi<{ cv: CandidateCv }>(`/candidate/cvs/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ displayName }),
})

export const setDefaultCandidateCvApi = (id: number) => fetchApi<{ cv: CandidateCv }>(`/candidate/cvs/${id}/default`, {
  method: 'PUT',
})

export const extractCandidateCvApi = (id: number) => fetchApi<{ cv: CandidateCv }>(`/candidate/cvs/${id}/extraction`, {
  method: 'PUT',
  timeoutMs: 30000,
})

export const deleteCandidateCvApi = (id: number) => fetchApi<{ id: number }>(`/candidate/cvs/${id}`, {
  method: 'DELETE',
})

export const downloadCandidateCvApi = async (cv: CandidateCv) => {
  const response = await fetch(getApiUrl(`/candidate/cvs/${cv.id}/download`), { credentials: 'include' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new ApiClientError(response.status, payload.error || { code: 'CV_DOWNLOAD_FAILED', message: 'Không thể tải CV.' })
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = cv.originalName
  anchor.click()
  URL.revokeObjectURL(url)
}
