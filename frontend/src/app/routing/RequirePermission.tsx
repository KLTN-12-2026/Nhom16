import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { Permission } from '../constants/permission.constant'
import { ROUTE } from '../constants/route.constant'
import { useAuth } from '../provider/auth-provider'
import { hasPermission } from '../utils/permission'

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { user } = useAuth()
  return hasPermission(user?.permissions, permission) ? <>{children}</> : <Navigate to={ROUTE.HOME} replace />
}
