import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { PERMISSION } from '../constants/permission.constant'
import { ROLE } from '../constants/role.constant'
import { AdminLayout } from '../layouts/admin-layout'
import { CandidateLayout } from '../layouts/candidate-layout'
import { EmployerLayout } from '../layouts/employer-layout'
import { PublicLayout } from '../layouts/public-layout'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import EmployerReviewPage from '../pages/admin/EmployerReviewPage'
import LoginPage from '../pages/auth/login'
import ForgotPasswordPage from '../pages/auth/forgot-password'
import GoogleCompletePage from '../pages/auth/google-complete'
import RegisterPage from '../pages/auth/register'
import ResetPasswordPage from '../pages/auth/reset-password'
import VerifyEmailPage from '../pages/auth/verify-email'
import CandidateHomePage from '../pages/candidate/CandidateHomePage'
import CandidateJobsPage from '../pages/candidate/CandidateJobsPage'
import ComingSoonPage from '../pages/common/ComingSoonPage'
import EmployerHomePage from '../pages/employer/EmployerHomePage'
import HomePage from '../pages/home/HomePage'
import CategoriesPage from '../pages/public/CategoriesPage'
import CvAnalysisPage from '../pages/public/CvAnalysisPage'
import ForEmployersPage from '../pages/public/ForEmployersPage'
import JobsPage from '../pages/public/JobsPage'
import { useAuth } from '../provider/auth-provider'
import { FullPageLoader } from './FullPageLoader'
import { RequireAuth } from './RequireAuth'
import { RequirePermission } from './RequirePermission'
import { RequireRole } from './RequireRole'

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
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomeEntry />} />
        <Route path="jobs" element={<JobsEntry />} />
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
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
      <Route path="employer" element={<RequireAuth><RequireRole role={ROLE.EMPLOYER}><EmployerLayout /></RequireRole></RequireAuth>}>
        <Route index element={<EmployerHomePage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
      <Route path="admin" element={<RequireAuth><RequireRole role={ROLE.ADMIN}><AdminLayout /></RequireRole></RequireAuth>}>
        <Route path="dashboard" element={<RequirePermission permission={PERMISSION.ADMIN_STATISTICS_VIEW}><AdminDashboardPage /></RequirePermission>} />
        <Route path="employers" element={<RequirePermission permission={PERMISSION.ADMIN_USER_MANAGE}><EmployerReviewPage /></RequirePermission>} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
