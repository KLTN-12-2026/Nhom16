import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { Role } from '../constants/role.constant'
import { ROUTE } from '../constants/route.constant'
import { useAuth } from '../provider/auth-provider'

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth()
  return user?.role === role ? <>{children}</> : <Navigate to={ROUTE.HOME} replace />
}
