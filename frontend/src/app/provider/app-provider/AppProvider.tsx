import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import { AuthProvider } from '../auth-provider'
import { ExternalAuthProvider } from '../external-auth-provider'
import { store } from '../../store'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ExternalAuthProvider><AuthProvider>{children}</AuthProvider></ExternalAuthProvider>
      </BrowserRouter>
    </Provider>
  )
}
