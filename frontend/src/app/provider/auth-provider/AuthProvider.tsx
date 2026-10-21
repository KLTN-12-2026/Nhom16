import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authApi } from '../../apis/auth'
import type { AuthUser } from '../../model/auth.model'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setSession: (user: AuthUser) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    authApi
      .getCurrentUser()
      .then((response) => active && setUser(response.data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setIsLoading(false))

    return () => {
      active = false
    }
  }, [])

  const setSession = useCallback((authenticatedUser: AuthUser) => {
    setUser(authenticatedUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), setSession, logout }),
    [isLoading, logout, setSession, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
