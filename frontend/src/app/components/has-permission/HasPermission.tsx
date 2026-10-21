import type { ReactNode } from 'react'

import type { Permission } from '../../constants/permission.constant'
import { useAuth } from '../../provider/auth-provider'
import { hasPermission } from '../../utils/permission'

interface HasPermissionProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function HasPermission({ permission, children, fallback = null }: HasPermissionProps) {
  const { user } = useAuth()
  return hasPermission(user?.permissions, permission) ? <>{children}</> : <>{fallback}</>
}
