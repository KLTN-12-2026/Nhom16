export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, string>
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: ApiErrorBody
  requestId?: string
}
