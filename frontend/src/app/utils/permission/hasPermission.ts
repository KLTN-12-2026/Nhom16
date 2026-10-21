import type { Permission } from '../../constants/permission.constant'

export const hasPermission = (
  userPermissions: readonly Permission[] | undefined,
  permission: Permission,
) => Boolean(userPermissions?.includes(permission))

export const hasAnyPermission = (
  userPermissions: readonly Permission[] | undefined,
  permissions: readonly Permission[],
) => permissions.some((permission) => hasPermission(userPermissions, permission))
