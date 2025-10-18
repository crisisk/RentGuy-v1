import { lazy, Suspense, useCallback, useEffect } from 'react'
import type { RouteObject } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '@application/auth/api'
import { AccessDenied, AuthSpinner, useAuthGuard } from './guards'
import { useAppRouterContext } from './index'

// Lazy load page components for code splitting
const Login = lazy(() => import('@ui/Login'))
const Planner = lazy(() => import('@ui/Planner'))
const SecretsDashboard = lazy(() => import('@ui/SecretsDashboard'))

function LoginRoute(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated, onLogin, defaultAuthenticatedPath, postLoginPath } = useAppRouterContext()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(defaultAuthenticatedPath, { replace: true })
    }
  }, [defaultAuthenticatedPath, isAuthenticated, navigate])

  const handleLogin = useCallback(
    (token: string, user: AuthUser) => {
      onLogin(token, user)
      navigate(postLoginPath, { replace: true })
    },
    [navigate, onLogin, postLoginPath],
  )

  return (
    <Suspense fallback={<AuthSpinner message="Laden…" />}>
      <Login onLogin={handleLogin} />
    </Suspense>
  )
}

function PlannerRoute(): JSX.Element {
  const navigate = useNavigate()
  const { onLogout, defaultUnauthenticatedPath } = useAppRouterContext()
  const guard = useAuthGuard({ requireAuth: true })

  useEffect(() => {
    if (!guard.isAuthenticated && guard.status !== 'checking') {
      navigate(defaultUnauthenticatedPath, { replace: true })
    }
  }, [defaultUnauthenticatedPath, guard.isAuthenticated, guard.status, navigate])

  if (!guard.isAuthenticated || guard.status === 'checking') {
    return <AuthSpinner message="Authenticatie controleren…" />
  }

  if (!guard.isAuthorised) {
    return (
      <AccessDenied
        onBackToLogin={() => navigate(defaultUnauthenticatedPath, { replace: true })}
      />
    )
  }

  const handleLogout = useCallback(() => {
    onLogout()
    navigate(defaultUnauthenticatedPath, { replace: true })
  }, [defaultUnauthenticatedPath, navigate, onLogout])

  return (
    <Suspense fallback={<AuthSpinner message="Planner laden…" />}>
      <Planner onLogout={handleLogout} />
    </Suspense>
  )
}

function SecretsDashboardRoute(): JSX.Element {
  const navigate = useNavigate()
  const { onLogout, defaultUnauthenticatedPath } = useAppRouterContext()
  const guard = useAuthGuard({ requireAuth: true, allowedRoles: ['admin'] })

  useEffect(() => {
    if (!guard.isAuthenticated && guard.status !== 'checking') {
      navigate(defaultUnauthenticatedPath, { replace: true })
    }
  }, [defaultUnauthenticatedPath, guard.isAuthenticated, guard.status, navigate])

  if (!guard.isAuthenticated || guard.status === 'checking') {
    return <AuthSpinner message="Authenticatie controleren…" />
  }

  if (!guard.isAuthorised) {
    return (
      <AccessDenied
        title="Administrator toegang vereist"
        description="Alleen beheerders hebben toegang tot het secrets dashboard."
        onBackToLogin={() => navigate(defaultUnauthenticatedPath, { replace: true })}
      />
    )
  }

  const handleLogout = useCallback(() => {
    onLogout()
    navigate(defaultUnauthenticatedPath, { replace: true })
  }, [defaultUnauthenticatedPath, navigate, onLogout])

  return (
    <Suspense fallback={<AuthSpinner message="Dashboard laden…" />}>
      <SecretsDashboard onLogout={handleLogout} />
    </Suspense>
  )
}

function RootRedirect(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated, defaultAuthenticatedPath, defaultUnauthenticatedPath } = useAppRouterContext()

  useEffect(() => {
    navigate(isAuthenticated ? defaultAuthenticatedPath : defaultUnauthenticatedPath, { replace: true })
  }, [defaultAuthenticatedPath, defaultUnauthenticatedPath, isAuthenticated, navigate])

  return <AuthSpinner message="Doorsturen…" />
}

function NotFoundRoute(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated, defaultAuthenticatedPath, defaultUnauthenticatedPath } = useAppRouterContext()

  useEffect(() => {
    navigate(isAuthenticated ? defaultAuthenticatedPath : defaultUnauthenticatedPath, { replace: true })
  }, [defaultAuthenticatedPath, defaultUnauthenticatedPath, isAuthenticated, navigate])

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

export function createAppRoutes(): RouteObject[] {
  return [
    { path: '/', element: <RootRedirect /> },
    { path: '/login', element: <LoginRoute /> },
    { path: '/planner', element: <PlannerRoute /> },
    { path: '/dashboard', element: <SecretsDashboardRoute /> },
    { path: '*', element: <NotFoundRoute /> },
  ]
}
