import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { ROUTE } from '../constants/route.constant'
import { useAuth } from '../provider/auth-provider'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTE.LOGIN} replace state={{ from: location }} />
}
