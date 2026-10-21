import { AppProvider } from './app/provider/app-provider'
import { AppRouter } from './app/routing/AppRouter'

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  )
}

export default App
