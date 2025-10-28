import { Suspense, useMemo, type ReactNode } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  type RouteObject,
} from 'react-router-dom'
import type { AuthUser } from '@application/auth/api'
import Login from '@ui/Login'
import { createAppRoutes } from './routes'

export interface AppRouterProps {
  readonly isAuthenticated: boolean
  readonly onLogin: (token: string, user: AuthUser) => void
  readonly onLogout: () => void
  readonly basename?: string
  readonly postLoginPath: string
  readonly defaultAuthenticatedPath: string
  readonly defaultUnauthenticatedPath: string
  readonly secretsFocusPath?: string
}

function normalisePath(value: string, fallback: string): string {
  const ensure = (input: string): string => {
    const trimmed = input.trim()
    if (!trimmed) {
      return ''
    }
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return withSlash.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
  }

  const resolvedFallback = ensure(fallback) || '/'
  const candidate = ensure(value)
  return candidate || resolvedFallback
}

function RouteLoadingFallback(): JSX.Element {
  return (
    <div
      role="status"
      style={{
        padding: '48px 32px',
        display: 'grid',
        gap: 12,
        justifyItems: 'center',
        color: '#64748B',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '4px solid rgba(100, 116, 139, 0.35)',
          borderTopColor: '#1D4ED8',
          animation: 'rg-router-spin 0.9s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.95rem' }}>Interface laden…</span>
      <style>
        {`
          @keyframes rg-router-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

function NotFoundFallback(): JSX.Element {
  return (
    <div
      style={{
        padding: '64px 24px',
        maxWidth: 480,
        margin: '0 auto',
        textAlign: 'center',
        display: 'grid',
        gap: 16,
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <span style={{ fontSize: '3rem' }} role="img" aria-label="Niet gevonden">
        🔍
      </span>
      <h1 style={{ margin: 0, fontSize: '1.85rem', color: '#0F172A' }}>Pagina niet gevonden</h1>
      <p style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>
        We konden de gevraagde route niet vinden. Controleer de URL of ga terug naar het dashboard.
      </p>
      <a
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center',
          padding: '10px 18px',
          borderRadius: 999,
          background: '#1D4ED8',
          color: '#FFFFFF',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Ga naar start
      </a>
    </div>
  )
}

function withSuspense(node: ReactNode): JSX.Element {
  return <Suspense fallback={<RouteLoadingFallback />}>{node}</Suspense>
}

function PasswordResetConfirmRoute({
  onLogin,
  isAuthenticated,
  redirectPath,
}: {
  onLogin: AppRouterProps['onLogin']
  isAuthenticated: boolean
  redirectPath: string
}): JSX.Element {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const token = params.get('token') ?? ''

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  return <Login onLogin={onLogin} initialMode="reset-confirm" initialResetToken={token} />
}

export function AppRouter({
  isAuthenticated,
  onLogin,
  onLogout,
  basename,
  postLoginPath,
  defaultAuthenticatedPath,
  defaultUnauthenticatedPath,
  secretsFocusPath,
}: AppRouterProps): JSX.Element {
  const loginPath = normalisePath(defaultUnauthenticatedPath, '/login')
  const authedHomePath = normalisePath(defaultAuthenticatedPath, '/planner')
  const postLoginTarget = normalisePath(postLoginPath, authedHomePath)

  const routeConfig = useMemo(() => {
    const applicationRoutes = createAppRoutes({ onLogout, secretsFocusPath })

    const guardedApplicationRoutes: RouteObject[] = applicationRoutes.map((route) => {
      const { requiresAuth, element, ...rest } = route
      const mustAuthenticate = requiresAuth !== false
      const guardedElement = mustAuthenticate ? (
        isAuthenticated ? (
          withSuspense(element)
        ) : (
          <Navigate to={loginPath} replace />
        )
      ) : (
        withSuspense(element)
      )

      return {
        ...rest,
        element: guardedElement,
      }
    })

    const routes: RouteObject[] = []
    const seenPaths = new Set<string>()

    const registerRoute = (route: RouteObject) => {
      if (typeof route.path === 'string') {
        const normalised = normalisePath(route.path, route.path)
        if (seenPaths.has(normalised)) {
          return
        }
        seenPaths.add(normalised)
        routes.push({ ...route, path: normalised })
        return
      }
      routes.push(route)
    }

    const resolveLoginElement = () =>
      isAuthenticated ? <Navigate to={postLoginTarget} replace /> : <Login onLogin={onLogin} />

    const resolveRegisterElement = () =>
      isAuthenticated ? (
        <Navigate to={postLoginTarget} replace />
      ) : (
        <Login onLogin={onLogin} initialMode="register" />
      )

    const resolvePasswordResetElement = () =>
      isAuthenticated ? (
        <Navigate to={postLoginTarget} replace />
      ) : (
        <Login onLogin={onLogin} initialMode="reset-request" />
      )

    registerRoute({ path: loginPath, element: resolveLoginElement() })
    if (loginPath !== '/login') {
      registerRoute({ path: '/login', element: resolveLoginElement() })
    }

    registerRoute({ path: '/register', element: resolveRegisterElement() })
    registerRoute({ path: '/forgot-password', element: resolvePasswordResetElement() })
    registerRoute({ path: '/password-reset', element: resolvePasswordResetElement() })
    registerRoute({
      path: '/password-reset/confirm',
      element: (
        <PasswordResetConfirmRoute
          onLogin={onLogin}
          isAuthenticated={isAuthenticated}
          redirectPath={postLoginTarget}
        />
      ),
    })
    registerRoute({ path: '/verify-email', element: resolveLoginElement() })

    registerRoute({
      path: '/',
      element: isAuthenticated ? (
        <Navigate to={authedHomePath} replace />
      ) : (
        <Navigate to={loginPath} replace />
      ),
    })

    for (const route of guardedApplicationRoutes) {
      registerRoute(route)
    }

    registerRoute({ path: '*', element: <NotFoundFallback /> })

    return routes
  }, [
    authedHomePath,
    isAuthenticated,
    loginPath,
    onLogin,
    onLogout,
    postLoginTarget,
    secretsFocusPath,
  ])

  const router = useMemo(
    () => createBrowserRouter(routeConfig, { basename }),
    [basename, routeConfig],
  )

  return <RouterProvider router={router} />
}

export default AppRouter
