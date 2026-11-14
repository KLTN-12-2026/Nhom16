import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { PERMISSION } from '../constants/permission.constant'
import { ROLE } from '../constants/role.constant'
import { AdminLayout } from '../layouts/admin-layout'
import { CandidateLayout } from '../layouts/candidate-layout'
import { EmployerLayout } from '../layouts/employer-layout'
import { PublicLayout } from '../layouts/public-layout'
import { useAuth } from '../provider/auth-provider'
import { FullPageLoader } from './FullPageLoader'
import { RequireAuth } from './RequireAuth'
import { RequirePermission } from './RequirePermission'
import { RequireRole } from './RequireRole'

const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'))
const EmployerReviewPage = lazy(() => import('../pages/admin/EmployerReviewPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const LoginPage = lazy(() => import('../pages/auth/login'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/forgot-password'))
const GoogleCompletePage = lazy(() => import('../pages/auth/google-complete'))
const RegisterPage = lazy(() => import('../pages/auth/register'))
const ResetPasswordPage = lazy(() => import('../pages/auth/reset-password'))
const VerifyEmailPage = lazy(() => import('../pages/auth/verify-email'))
const CandidateHomePage = lazy(() => import('../pages/candidate/CandidateHomePage'))
const CandidateCvPage = lazy(() => import('../pages/candidate/CandidateCvPage'))
const CandidateJobsPage = lazy(() => import('../pages/candidate/CandidateJobsPage'))
const CandidateProfilePage = lazy(() => import('../pages/candidate/CandidateProfilePage'))
const CandidateApplicationsPage = lazy(() => import('../pages/candidate/CandidateApplicationsPage'))
const CandidateSavedJobsPage = lazy(() => import('../pages/candidate/CandidateSavedJobsPage'))
const CandidateAiMatchPage = lazy(() => import('../pages/candidate/CandidateAiMatchPage'))
const ComingSoonPage = lazy(() => import('../pages/common/ComingSoonPage'))
const EmployerHomePage = lazy(() => import('../pages/employer/EmployerHomePage'))
const EmployerProfilePage = lazy(() => import('../pages/employer/EmployerProfilePage'))
const EmployerJobsPage = lazy(() => import('../pages/employer/EmployerJobsPage'))
const EmployerJobFormPage = lazy(() => import('../pages/employer/EmployerJobFormPage'))
const EmployerApplicationsPage = lazy(() => import('../pages/employer/EmployerApplicationsPage'))
const EmployerFavoriteCandidatesPage = lazy(() => import('../pages/employer/EmployerFavoriteCandidatesPage'))
const EmployerRecommendationsPage = lazy(() => import('../pages/employer/EmployerRecommendationsPage'))
const EmployerJdAiPage = lazy(() => import('../pages/employer/EmployerJdAiPage'))
const HomePage = lazy(() => import('../pages/home/HomePage'))
const CategoriesPage = lazy(() => import('../pages/public/CategoriesPage'))
const CvAnalysisPage = lazy(() => import('../pages/public/CvAnalysisPage'))
const ForEmployersPage = lazy(() => import('../pages/public/ForEmployersPage'))
const JobsPage = lazy(() => import('../pages/public/JobsPage'))
const JobDetailPage = lazy(() => import('../pages/public/JobDetailPage'))

function HomeEntry() {
  const { user } = useAuth()
  if (!user) return <HomePage />
  if (user.role === ROLE.CANDIDATE) return <Navigate to="/candidate" replace />
  if (user.role === ROLE.EMPLOYER) return <Navigate to="/employer" replace />
  return <Navigate to="/admin/dashboard" replace />
}

function JobsEntry() {
  const { user } = useAuth()
  const location = useLocation()
  if (user?.role === ROLE.CANDIDATE) {
    return <Navigate to={`/candidate/jobs${location.search}`} replace />
  }
  return <JobsPage />
}

export function AppRouter() {
  const { isLoading } = useAuth()
  if (isLoading) return <FullPageLoader />

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomeEntry />} />
        <Route path="jobs" element={<JobsEntry />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="cv-analysis" element={<CvAnalysisPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="for-employers" element={<ForEmployersPage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="auth/google-complete" element={<GoogleCompletePage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route path="candidate" element={<RequireAuth><RequireRole role={ROLE.CANDIDATE}><CandidateLayout /></RequireRole></RequireAuth>}>
        <Route index element={<CandidateHomePage />} />
        <Route path="jobs" element={<CandidateJobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="cv" element={<RequirePermission permission={PERMISSION.CV_MANAGE}><CandidateCvPage /></RequirePermission>} />
        <Route path="profile" element={<CandidateProfilePage />} />
        <Route path="applications" element={<CandidateApplicationsPage />} />
        <Route path="applications/:applicationId/job" element={<JobDetailPage />} />
        <Route path="saved-jobs" element={<CandidateSavedJobsPage />} />
        <Route path="ai/job-match" element={<CandidateAiMatchPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

      <Route path="employer" element={<RequireAuth><RequireRole role={ROLE.EMPLOYER}><EmployerLayout /></RequireRole></RequireAuth>}>
        <Route index element={<EmployerHomePage />} />
        <Route path="company" element={<EmployerProfilePage />} />
        <Route path="profile" element={<EmployerProfilePage />} />
        <Route path="jobs" element={<EmployerJobsPage />} />
        <Route path="jobs/new" element={<EmployerJobFormPage />} />
        <Route path="jobs/:id/edit" element={<EmployerJobFormPage />} />
        <Route path="applications" element={<EmployerApplicationsPage />} />
        <Route path="favorite-candidates" element={<EmployerFavoriteCandidatesPage />} />
        <Route path="recommendations" element={<RequirePermission permission={PERMISSION.CANDIDATE_RECOMMENDATION_VIEW}><EmployerRecommendationsPage /></RequirePermission>} />
        <Route path="ai/jd-analysis" element={<EmployerJdAiPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

      <Route path="admin" element={<RequireAuth><RequireRole role={ROLE.ADMIN}><AdminLayout /></RequireRole></RequireAuth>}>
        <Route path="dashboard" element={<RequirePermission permission={PERMISSION.ADMIN_STATISTICS_VIEW}><AdminDashboardPage /></RequirePermission>} />
        <Route path="employers" element={<RequirePermission permission={PERMISSION.ADMIN_USER_MANAGE}><EmployerReviewPage /></RequirePermission>} />
        <Route path="users" element={<RequirePermission permission={PERMISSION.ADMIN_USER_MANAGE}><AdminUsersPage /></RequirePermission>} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
