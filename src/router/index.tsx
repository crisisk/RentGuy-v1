import { createContext, useContext, useMemo } from 'react'
import type { AuthUser } from '@application/auth/api'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { createAppRoutes } from './routes'

interface AppRouterContextValue {
  readonly isAuthenticated: boolean
  readonly onLogin: (token: string, user: AuthUser) => void
  readonly onLogout: () => void
  readonly postLoginPath: string
  readonly defaultAuthenticatedPath: string
  readonly defaultUnauthenticatedPath: string
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
  readonly postLoginPath: string
  readonly defaultAuthenticatedPath: string
  readonly defaultUnauthenticatedPath: string
}

export function AppRouter({
  isAuthenticated,
  onLogin,
  onLogout,
  basename = '',
  postLoginPath,
  defaultAuthenticatedPath,
  defaultUnauthenticatedPath,
}: AppRouterProps): JSX.Element {
  const router = useMemo(() => createBrowserRouter(createAppRoutes(), { basename }), [basename])
  const contextValue = useMemo<AppRouterContextValue>(
    () => ({
      isAuthenticated,
      onLogin,
      onLogout,
      postLoginPath,
      defaultAuthenticatedPath,
      defaultUnauthenticatedPath,
    }),
    [
      defaultAuthenticatedPath,
      defaultUnauthenticatedPath,
      isAuthenticated,
      onLogin,
      onLogout,
      postLoginPath,
    ],
  )

  return (
    <AppRouterContext.Provider value={contextValue}>
      <RouterProvider router={router} />
    </AppRouterContext.Provider>
  )
}

export default AppRouter
