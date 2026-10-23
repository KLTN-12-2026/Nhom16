import type { ApiErrorBody, ApiResponse } from '../../model/api.model'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '')

export class ApiClientError extends Error {
  status: number
  code: string
  details?: Record<string, string>
  requestId?: string

  constructor(status: number, error: ApiErrorBody, requestId?: string) {
    super(error.message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = error.code
    this.details = error.details
    this.requestId = requestId
  }
}

interface FetchApiOptions extends RequestInit {
  timeoutMs?: number
  skipAuthRefresh?: boolean
}

export async function fetchApi<T>(path: string, options: FetchApiOptions = {}): Promise<ApiResponse<T>> {
  const { timeoutMs = 15000, skipAuthRefresh = false, headers, body, ...requestOptions } = options
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      body,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
    })
    const payload = (await response.json().catch(() => ({}))) as Partial<ApiResponse<T>>

    if (response.status === 401 && !skipAuthRefresh && (path === '/auth/me' || !path.startsWith('/auth/'))) {
      await fetchApi('/auth/refresh', { method: 'POST', skipAuthRefresh: true })
      return fetchApi<T>(path, { ...options, skipAuthRefresh: true })
    }

    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        payload.error || { code: 'REQUEST_FAILED', message: 'Không thể thực hiện yêu cầu.' },
        payload.requestId,
      )
    }

    return payload as ApiResponse<T>
  } catch (error) {
    if (error instanceof ApiClientError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(408, { code: 'REQUEST_TIMEOUT', message: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.' })
    }
    throw new ApiClientError(0, { code: 'NETWORK_ERROR', message: 'Không thể kết nối đến máy chủ.' })
  } finally {
    window.clearTimeout(timeout)
  }
}
