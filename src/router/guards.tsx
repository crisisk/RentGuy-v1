import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'
import type { AuthUser } from '@application/auth/api'
import { useAuthStore, type AuthStatus } from '@stores/authStore'

export interface AuthGuardOptions {
  readonly requireAuth?: boolean
  readonly allowedRoles?: string[]
}

export interface AuthGuardResult {
  readonly status: AuthStatus
  readonly user: AuthUser | null
  readonly isAuthenticated: boolean
  readonly isAuthorised: boolean
}

export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const status = useAuthStore(state => state.status)
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)

  const isAuthenticated = Boolean(token)
  const requireAuth = options.requireAuth !== false
  const allowedRoles = options.allowedRoles?.filter(role => role && role.trim().length > 0) ?? []
  const userRole = typeof user?.role === 'string' ? user.role.trim() : ''

  let isAuthorised = true
  if (requireAuth && allowedRoles.length > 0) {
    isAuthorised = userRole ? allowedRoles.includes(userRole) : false
  }

  if (!requireAuth) {
    isAuthorised = true
  }

  return {
    status,
    user,
    isAuthenticated,
    isAuthorised,
  }
}

export interface AuthSpinnerProps {
  readonly message?: string
}

export function AuthSpinner({ message = 'Laden…' }: AuthSpinnerProps) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        fontFamily: brandFontStack,
        color: brand.colors.text,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: `4px solid ${withOpacity(brand.colors.primary, 0.25)}`,
          borderTopColor: brand.colors.primary,
          animation: 'rg-spin 1s linear infinite',
        }}
      />
      <span style={{ fontSize: '1rem', fontWeight: 600 }}>{message}</span>
      <style>
        {`@keyframes rg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  )
}

export interface AccessDeniedProps {
  readonly title?: string
  readonly description?: string
  readonly onBackToLogin?: () => void
}

export function AccessDenied({
  title = 'Geen toegang',
  description = 'Je hebt geen rechten om deze pagina te bekijken.',
  onBackToLogin,
}: AccessDeniedProps) {
  return (
    <div
      role="alert"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '48px 20px',
        fontFamily: brandFontStack,
        color: brand.colors.text,
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 12,
          maxWidth: 420,
          textAlign: 'center',
          background: withOpacity(brand.colors.primary, 0.05),
          border: `1px solid ${withOpacity(brand.colors.primary, 0.2)}`,
          borderRadius: 18,
          padding: '28px 32px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.45rem',
            fontFamily: headingFontStack,
            color: brand.colors.primary,
          }}
        >
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: '1rem', color: withOpacity(brand.colors.text, 0.82) }}>{description}</p>
        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              marginTop: 8,
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              background: brand.colors.primary,
              color: '#ffffff',
            }}
          >
            Terug naar login
          </button>
        )}
      </div>
    </div>
  )
}
