import { createContext, useCallback, useEffect, useMemo, type ReactNode } from 'react'

import type { AuthUser } from '../../model/auth.model'
import { authActions } from '../../modules/auth/redux'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const { user, initialized } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(authActions.bootstrapRequested())
  }, [dispatch])

  const logout = useCallback(async () => {
    dispatch(authActions.logoutRequested())
  }, [dispatch])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading: !initialized, isAuthenticated: Boolean(user), logout }),
    [initialized, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
