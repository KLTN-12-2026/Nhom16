import { fetchApi } from '../fetch-api'
export interface JdAnalysis { id: number; jobId: number; analysisVersion: number; status: 'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'; title?: string; summary?: string; responsibilities: string[]; requiredSkills: string[]; preferredSkills: string[]; experienceRequirements: string[]; educationRequirements: string[]; keywords: string[]; mandatoryRequirements: string[]; errorMessage?: string; isConfirmed: boolean; analyzedAt?: string; job?: { id: number; title: string; company: string } }
export interface MatchCriterion { criterion: string; evidence: string }
export interface CvJobComparison { id: number; cvId: number; jobId: number; status: 'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'; matchScore: number | null; metCriteria: MatchCriterion[]; partialCriteria: MatchCriterion[]; missingCriteria: MatchCriterion[]; explanation?: string; errorMessage?: string; comparedAt?: string; job?: { id: number; title: string; company: string; location: string }; cv?: { id: number; displayName: string; headline?: string } }
export const listJdAnalysesApi = () => fetchApi<JdAnalysis[]>('/employer/ai/jd-analyses')
export const requestJdAnalysisApi = (jobId: number, force = false) => fetchApi<JdAnalysis>(`/employer/ai/jobs/${jobId}/jd-analysis`, { method: 'POST', body: JSON.stringify({ force }) })
export const updateJdAnalysisApi = (id: number, data: Partial<JdAnalysis>) => fetchApi<JdAnalysis>(`/employer/ai/jd-analyses/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const confirmJdAnalysisApi = (id: number) => fetchApi<JdAnalysis>(`/employer/ai/jd-analyses/${id}/confirm`, { method: 'POST' })
export const listCvJobComparisonsApi = () => fetchApi<CvJobComparison[]>('/candidate/ai/job-comparisons')
export const getCvJobComparisonApi = (cvId: number, jobId: number) => fetchApi<CvJobComparison | null>(`/candidate/ai/job-comparisons?cvId=${cvId}&jobId=${jobId}`)
export const requestCvJobComparisonApi = (cvId: number, jobId: number, force = false) => fetchApi<CvJobComparison>('/candidate/ai/job-comparisons', { method: 'POST', body: JSON.stringify({ cvId, jobId, force }) })
export const deleteCvJobComparisonApi = (id: number) => fetchApi<{ id: number }>(`/candidate/ai/job-comparisons/${id}`, { method: 'DELETE' })

export interface RecommendedCvSummary {
  id: number
  displayName: string
  originalName: string
  isDefault: boolean
  headline: string | null
  skills: string[]
  extractionStatus: 'completed' | 'partial'
  analysisVersion: number
  analyzedAt: string | null
}

export interface JobRecommendationItem {
  rank: number
  matchScore: number
  matchTier: 'high' | 'medium' | 'low'
  scoreSource: 'ai_verified' | 'jd_matched'
  matchedSkills: string[]
  partialMatches: string[]
  missingRequirements: string[]
  explanation: string
  cvAnalysisVersion: number
  jdAnalysisVersion: number | null
  isSaved: boolean
  hasApplied: boolean
  applicationStatus: string | null
  job: import('../job').JobData
}

export interface CandidateJobRecommendationsResponse {
  selectedCv: RecommendedCvSummary | null
  analyzedCvs: RecommendedCvSummary[]
  recommendations: JobRecommendationItem[]
  emptyReason: 'CV_ANALYSIS_REQUIRED' | 'NO_MATCHING_JOBS' | null
  meta: {
    totalActiveJobs: number
    totalMatched: number
    aiVerifiedCount: number
    updatedAt: string
  }
}

export interface JobRecommendationQuery {
  cvId?: number
  search?: string
  minScore?: number
  hideApplied?: boolean
  limit?: number
}

export const getCandidateJobRecommendationsApi = (params: JobRecommendationQuery = {}) => {
  const query = new URLSearchParams()
  if (params.cvId) query.set('cvId', String(params.cvId))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (typeof params.minScore === 'number' && params.minScore > 0) query.set('minScore', String(params.minScore))
  if (params.hideApplied) query.set('hideApplied', 'true')
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return fetchApi<CandidateJobRecommendationsResponse>(`/candidate/ai/recommendations${qs ? `?${qs}` : ''}`)
}
