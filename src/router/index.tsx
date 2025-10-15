import { createContext, useContext, useMemo } from 'react'
import type { AuthUser } from '@application/auth/api'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { createAppRoutes } from './routes'

interface AppRouterContextValue {
  readonly isAuthenticated: boolean
  readonly onLogin: (token: string, user: AuthUser) => void
  readonly onLogout: () => void
}

const AppRouterContext = createContext<AppRouterContextValue | null>(null)

export function useAppRouterContext(): AppRouterContextValue {
  const context = useContext(AppRouterContext)
  if (!context) {
    throw new Error('useAppRouterContext must be used within an AppRouter provider')
  }
  return context
}

export interface AppRouterProps {
  readonly isAuthenticated: boolean
  readonly onLogin: (token: string, user: AuthUser) => void
  readonly onLogout: () => void
  readonly basename?: string
}

export function AppRouter({ isAuthenticated, onLogin, onLogout, basename = '' }: AppRouterProps): JSX.Element {
  const router = useMemo(() => createBrowserRouter(createAppRoutes(), { basename }), [basename])
  const contextValue = useMemo<AppRouterContextValue>(
    () => ({ isAuthenticated, onLogin, onLogout }),
    [isAuthenticated, onLogin, onLogout],
  )

  return (
    <AppRouterContext.Provider value={contextValue}>
      <RouterProvider router={router} />
    </AppRouterContext.Provider>
  )
}

export default AppRouter
