import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '../auth-provider'
import { ExternalAuthProvider } from '../external-auth-provider'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ExternalAuthProvider><AuthProvider>{children}</AuthProvider></ExternalAuthProvider>
    </BrowserRouter>
  )
}
