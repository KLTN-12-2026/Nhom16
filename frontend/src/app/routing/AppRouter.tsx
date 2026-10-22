import { Navigate, Route, Routes } from 'react-router-dom'

import { PERMISSION } from '../constants/permission.constant'
import { ROLE } from '../constants/role.constant'
import { AdminLayout } from '../layouts/admin-layout'
import { CandidateLayout } from '../layouts/candidate-layout'
import { EmployerLayout } from '../layouts/employer-layout'
import { PublicLayout } from '../layouts/public-layout'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import LoginPage from '../pages/auth/login'
import RegisterPage from '../pages/auth/register'
import CandidateHomePage from '../pages/candidate/CandidateHomePage'
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

export function AppRouter() {
  const { isLoading } = useAuth()
  if (isLoading) return <FullPageLoader />

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomeEntry />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="cv-analysis" element={<CvAnalysisPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="for-employers" element={<ForEmployersPage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
      </Route>
      <Route path="candidate" element={<RequireAuth><RequireRole role={ROLE.CANDIDATE}><CandidateLayout /></RequireRole></RequireAuth>}>
        <Route index element={<CandidateHomePage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
      <Route path="employer" element={<RequireAuth><RequireRole role={ROLE.EMPLOYER}><EmployerLayout /></RequireRole></RequireAuth>}>
        <Route index element={<EmployerHomePage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
      <Route path="admin" element={<RequireAuth><RequireRole role={ROLE.ADMIN}><AdminLayout /></RequireRole></RequireAuth>}>
        <Route path="dashboard" element={<RequirePermission permission={PERMISSION.ADMIN_STATISTICS_VIEW}><AdminDashboardPage /></RequirePermission>} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
