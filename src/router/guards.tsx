import { useMemo, type ReactElement } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, type AuthStatus } from '@stores/authStore'

export function AuthSpinner(): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'grid',
        gap: 12,
        justifyItems: 'center',
        alignContent: 'center',
        minHeight: '60vh',
        padding: '48px 16px',
        color: '#334155',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
      data-testid="auth-spinner"
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '4px solid rgba(51, 65, 85, 0.3)',
          borderTopColor: '#2563EB',
          animation: 'rg-auth-spinner 0.9s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.95rem' }}>Authenticatie controleren…</span>
      <style>
        {`
          @keyframes rg-auth-spinner {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export interface AccessDeniedProps {
  readonly requiredRoles?: readonly string[]
  readonly currentRole?: string | null
}

export function AccessDenied({ requiredRoles = [], currentRole }: AccessDeniedProps): JSX.Element {
  const location = useLocation()
  const requirementDescription = requiredRoles.length
    ? requiredRoles
        .map((role) => role.trim())
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: '64px 24px',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'grid',
        gap: 16,
      }}
      data-testid="access-denied"
    >
      <span aria-hidden="true" style={{ fontSize: '3rem' }}>
        🔒
      </span>
      <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0F172A' }}>Geen toegang</h1>
      <p style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>
        Je hebt geen rechten om <code>{location.pathname}</code> te bekijken.
      </p>
      {requirementDescription ? (
        <p style={{ margin: 0, color: '#64748B', fontSize: '0.95rem' }}>
          Vereiste rollen: <strong>{requirementDescription}</strong>
          {currentRole ? (
            <>
              {' · '}Jouw rol: <strong>{currentRole}</strong>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

interface UseAuthGuardOptions {
  readonly requiredRoles?: readonly string[]
}

export interface AuthGuardState {
  readonly status: AuthStatus
  readonly isChecking: boolean
  readonly isAuthenticated: boolean
  readonly allowed: boolean
  readonly reason: 'unauthenticated' | 'unauthorised' | null
  readonly role: string | null
  readonly requiredRoles: readonly string[]
  readonly error: string | null
}

function normaliseRole(role?: string | null): string {
  return typeof role === 'string' ? role.trim().toLowerCase() : ''
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardState {
  const { status, user, error } = useAuthStore((state) => ({
    status: state.status,
    user: state.user,
    error: state.error,
  }))

  const requiredRoles = useMemo(() => {
    if (!options.requiredRoles?.length) {
      return [] as string[]
    }
    return options.requiredRoles
      .map((role) => normaliseRole(role))
      .filter((role) => role.length > 0)
  }, [options.requiredRoles])

  const isChecking = status === 'checking'
  const isAuthenticated = status === 'authenticated' || status === 'offline'
  const role = user?.role ?? null
  const normalisedRole = normaliseRole(role)
  const roleAllowed = requiredRoles.length === 0 || requiredRoles.includes(normalisedRole)
  const allowed = isAuthenticated && roleAllowed
  const reason: AuthGuardState['reason'] = allowed
    ? null
    : isAuthenticated
      ? 'unauthorised'
      : 'unauthenticated'

  return {
    status,
    isChecking,
    isAuthenticated,
    allowed,
    reason,
    role,
    requiredRoles,
    error,
  }
}

export interface AuthGuardProps {
  readonly children?: ReactElement
  readonly redirectTo?: string
  readonly requiredRoles?: readonly string[]
  readonly fallback?: ReactElement
}

export function AuthGuard({
  children,
  redirectTo = '/login',
  requiredRoles,
  fallback,
}: AuthGuardProps): JSX.Element {
  const {
    isChecking,
    isAuthenticated,
    allowed,
    role,
    requiredRoles: roles,
  } = useAuthGuard(requiredRoles ? { requiredRoles } : undefined)

  if (isChecking) {
    return fallback ?? <AuthSpinner />
  }

  if (!allowed) {
    if (!isAuthenticated) {
      return <Navigate to={redirectTo} replace />
    }
    return <AccessDenied requiredRoles={roles} currentRole={role} />
  }

  return children ?? <Outlet />
}

export interface PublicGuardProps {
  readonly children?: ReactElement
  readonly redirectTo?: string
  readonly fallback?: ReactElement
}

export function PublicGuard({
  children,
  redirectTo = '/',
  fallback,
}: PublicGuardProps): JSX.Element {
  const { isChecking, isAuthenticated } = useAuthGuard()

  if (isChecking) {
    return fallback ?? <AuthSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo || '/'} replace />
  }

  return children ?? <Outlet />
}
