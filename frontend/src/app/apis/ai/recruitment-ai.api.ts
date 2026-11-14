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
