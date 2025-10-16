import { useCallback, useEffect } from 'react'
import type { RouteObject } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Login from '@ui/Login'
import Planner from '@ui/Planner'
import SecretsDashboard from '@ui/SecretsDashboard'
import type { AuthUser } from '@application/auth/api'
import { AccessDenied, AuthSpinner, useAuthGuard } from './guards'
import { useAppRouterContext } from './index'

function LoginRoute(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated, onLogin } = useAppRouterContext()

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

function PlannerRoute(): JSX.Element {
  const navigate = useNavigate()
  const { onLogout } = useAppRouterContext()
  const guard = useAuthGuard({ requireAuth: true })

  useEffect(() => {
    if (!guard.isAuthenticated && guard.status !== 'checking') {
      navigate('/login', { replace: true })
    }
  }, [guard.isAuthenticated, guard.status, navigate])

  if (!guard.isAuthenticated || guard.status === 'checking') {
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

function SecretsDashboardRoute(): JSX.Element {
  const navigate = useNavigate()
  const { onLogout } = useAppRouterContext()
  const guard = useAuthGuard({ requireAuth: true, allowedRoles: ['admin'] })

  useEffect(() => {
    if (!guard.isAuthenticated && guard.status !== 'checking') {
      navigate('/login', { replace: true })
    }
  }, [guard.isAuthenticated, guard.status, navigate])

  if (!guard.isAuthenticated || guard.status === 'checking') {
    return <AuthSpinner message="Authenticatie controleren…" />
  }

  if (!guard.isAuthorised) {
    return (
      <AccessDenied
        title="Administrator toegang vereist"
        description="Alleen beheerders hebben toegang tot het secrets dashboard."
        onBackToLogin={() => navigate('/login', { replace: true })}
      />
    )
  }

  const handleLogout = useCallback(() => {
    onLogout()
    navigate('/login', { replace: true })
  }, [navigate, onLogout])

  return <SecretsDashboard onLogout={handleLogout} />
}

function RootRedirect(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppRouterContext()

  useEffect(() => {
    navigate(isAuthenticated ? '/planner' : '/login', { replace: true })
  }, [isAuthenticated, navigate])

  return <AuthSpinner message="Doorsturen…" />
}

function NotFoundRoute(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppRouterContext()

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

export function createAppRoutes(): RouteObject[] {
  return [
    { path: '/', element: <RootRedirect /> },
    { path: '/login', element: <LoginRoute /> },
    { path: '/planner', element: <PlannerRoute /> },
    { path: '/dashboard', element: <SecretsDashboardRoute /> },
    { path: '*', element: <NotFoundRoute /> },
  ]
}
