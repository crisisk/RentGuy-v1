import { useCallback, useEffect } from 'react'
import type { AuthUser } from '@application/auth/api'
import Login from '@ui/Login'
import Planner from '@ui/Planner'
import { AccessDenied, AuthSpinner, useAuthGuard } from './guards'

export interface NavigateOptions {
  readonly replace?: boolean
}

export type NavigateFunction = (path: string, options?: NavigateOptions) => void

export interface RouteContext {
  readonly currentPath: string
  readonly navigate: NavigateFunction
  readonly isAuthenticated: boolean
  readonly onLogin: (token: string, user: AuthUser) => void
  readonly onLogout: () => void
}

export interface RouteDefinition {
  readonly path: string
  readonly render: (context: RouteContext) => JSX.Element
  readonly match?: (path: string) => boolean
}

function normalisePath(path: string): string {
  if (!path) {
    return '/'
  }
  const trimmed = path.trim()
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`
  }
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1)
  }
  return trimmed
}

const baseRoutes: RouteDefinition[] = [
  {
    path: '/login',
    render: (context) => <LoginRoute {...context} />,
  },
  {
    path: '/planner',
    render: (context) => <PlannerRoute {...context} />,
  },
  {
    path: '/',
    render: (context) => <RootRoute {...context} />,
  },
  {
    path: '*',
    match: () => true,
    render: (context) => <NotFoundRoute {...context} />,
  },
]

export interface AppRoutesProps extends RouteContext {}

export function AppRoutes(props: AppRoutesProps): JSX.Element {
  const candidate = baseRoutes.find((route) => {
    if (route.match) {
      return route.match(props.currentPath)
    }
    return normalisePath(props.currentPath) === route.path
  })

  const activeRoute = candidate ?? baseRoutes[baseRoutes.length - 1]!
  return activeRoute.render(props)
}

function LoginRoute({ isAuthenticated, navigate, onLogin }: RouteContext) {
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/planner', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleLogin = useCallback(
    (token: string, user: AuthUser) => {
      onLogin(token, user)
      navigate('/planner', { replace: true })
    },
    [navigate, onLogin],
  )

  return <Login onLogin={handleLogin} />
}

function PlannerRoute({ navigate, onLogout }: RouteContext) {
  const guard = useAuthGuard({ requireAuth: true })

  useEffect(() => {
    if (!guard.isAuthenticated && guard.status !== 'checking') {
      navigate('/login', { replace: true })
    }
  }, [guard.isAuthenticated, guard.status, navigate])

  if (!guard.isAuthenticated) {
    return <AuthSpinner message="Authenticatie controleren…" />
  }

  if (guard.status === 'checking') {
    return <AuthSpinner message="Authenticatie controleren…" />
  }

  if (!guard.isAuthorised) {
    return <AccessDenied onBackToLogin={() => navigate('/login', { replace: true })} />
  }

  const handleLogout = useCallback(() => {
    onLogout()
    navigate('/login', { replace: true })
  }, [navigate, onLogout])

  return <Planner onLogout={handleLogout} />
}

function RootRoute({ isAuthenticated, navigate }: RouteContext) {
  useEffect(() => {
    navigate(isAuthenticated ? '/planner' : '/login', { replace: true })
  }, [isAuthenticated, navigate])

  return <AuthSpinner message="Doorsturen…" />
}

function NotFoundRoute({ navigate, isAuthenticated }: RouteContext) {
  useEffect(() => {
    navigate(isAuthenticated ? '/planner' : '/login', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ fontSize: '1rem' }}>Pagina niet gevonden. Je wordt doorgestuurd…</p>
    </div>
  )
}
