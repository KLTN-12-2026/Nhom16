import { fetchApi } from '../fetch-api'

export interface JobCategory {
  id: number
  code: string
  name: string
  shortName: string
  legalReference?: string
}

export interface JobData {
  id: number
  title: string
  company: string
  companyLogo: string
  companyLogoClass: string
  category: JobCategory
  salary: string
  salaryMin: number | null
  salaryMax: number | null
  location: string
  workMode: string
  workModeLabel: string
  experienceLevel: string
  experienceLabel: string
  employmentType: string
  employmentTypeLabel: string
  positionLevel: string
  positionLabel: string
  postedAt: string
  publishedAt: string
  deadline: string
  status: string
  tags: string[]
  description: string
  requirements: string[]
  benefits: string[]
}

export interface JobFilters {
  search?: string
  category?: string
  location?: string
  salary?: string
  experience?: string
  workMode?: string
  employmentType?: string
  positionLevel?: string
  sort?: string
  page?: number
  limit?: number
}

export const listPublicJobsApi = (filters: JobFilters) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  return fetchApi<{ jobs: JobData[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/jobs?${params}`)
}

export const listJobCategoriesApi = () => fetchApi<{ categories: JobCategory[] }>('/jobs/categories')
export const getPublicJobApi = (id: number | string) => fetchApi<JobData>(`/jobs/${id}`)
