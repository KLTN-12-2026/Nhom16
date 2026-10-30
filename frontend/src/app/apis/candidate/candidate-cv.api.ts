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

interface PresignedUpload {
  upload: { url: string; fields: Record<string, string> }
  key: string
  expiresIn: number
}

export const uploadCandidateCvApi = async (file: File, displayName: string) => {
  const prepared = await fetchApi<PresignedUpload>('/candidate/cvs/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type, sizeBytes: file.size }),
  })
  const form = new FormData()
  Object.entries(prepared.data.upload.fields).forEach(([key, value]) => form.append(key, value))
  form.append('file', file)
  const uploaded = await fetch(prepared.data.upload.url, { method: 'POST', body: form })
  if (!uploaded.ok) {
    throw new ApiClientError(uploaded.status, { code: 'CV_UPLOAD_FAILED', message: 'Không thể tải CV lên kho lưu trữ.' })
  }
  return fetchApi<{ cv: CandidateCv }>('/candidate/cvs/uploads/confirm', {
    method: 'POST',
    body: JSON.stringify({
      objectKey: prepared.data.key,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      displayName: displayName.trim() || null,
    }),
  })
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
