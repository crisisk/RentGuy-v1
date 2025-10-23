import { useMemo, type CSSProperties } from 'react'
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from 'react-router-dom'
import { brand, headingFontStack, withOpacity } from '@ui/branding'

type ErrorDetails = {
  status?: number
  statusText?: string
  message: string
  stack?: string
}

function normaliseError(error: unknown): ErrorDetails {
  if (isRouteErrorResponse(error)) {
    const status = error.status
    const statusText = error.statusText || undefined
    const message =
      (typeof error.data === 'object' && error.data && 'message' in error.data
        ? String((error.data as Record<string, unknown>).message ?? '')
        : '') ||
      statusText ||
      'Er trad een onverwachte fout op'

    const details: ErrorDetails = { status, message }
    if (statusText) {
      details.statusText = statusText
    }
    return details
  }

  if (error instanceof Error) {
    const details: ErrorDetails = {
      message: error.message || 'Er ging iets mis',
    }
    if (typeof error.stack === 'string' && error.stack.trim()) {
      details.stack = error.stack
    }
    return details
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  return { message: 'Er trad een onverwachte fout op' }
}

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
  background: `radial-gradient(circle at top, ${withOpacity(brand.colors.primary, 0.1)} 0%, transparent 55%) ${brand.colors.appBackground}`,
  color: brand.colors.secondary,
  fontFamily: brand.fontStack,
}

const cardStyle: CSSProperties = {
  width: 'min(520px, 100%)',
  display: 'grid',
  gap: 20,
  padding: '32px clamp(18px, 4vw, 36px)',
  borderRadius: 28,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(231, 236, 255, 0.92) 100%)',
  boxShadow: brand.colors.shadow,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
}

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: brand.colors.primary,
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  textDecoration: 'none',
}

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: 'transparent',
  color: brand.colors.primary,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.35)}`,
}

export default function ErrorPage(): JSX.Element {
  const navigate = useNavigate()
  const routeError = useRouteError()
  const details = useMemo(() => normaliseError(routeError), [routeError])
  const heading = details.status ? `Fout ${details.status}` : 'Er ging iets mis'
  const showStack = Boolean(details.stack && import.meta.env.DEV)

  return (
    <div style={containerStyle}>
      <section style={cardStyle} role="alert" aria-live="assertive">
        <div style={{ display: 'grid', gap: 12 }}>
          <span
            aria-hidden
            style={{
              fontSize: '2.4rem',
              lineHeight: 1,
              filter: 'drop-shadow(0 12px 22px rgba(15,23,42,0.12))',
            }}
          >
            ⚠️
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: headingFontStack,
              fontSize: '2rem',
              lineHeight: 1.2,
              color: brand.colors.secondary,
            }}
          >
            {heading}
          </h1>
          {details.statusText && (
            <p style={{ margin: 0, color: withOpacity(brand.colors.secondary, 0.75) }}>
              {details.statusText}
            </p>
          )}
          <p style={{ margin: 0, color: withOpacity(brand.colors.secondary, 0.85) }}>
            {details.message}
          </p>
        </div>

        {showStack && (
          <div
            style={{
              background: withOpacity(brand.colors.primary, 0.08),
              borderRadius: 16,
              padding: '12px 14px',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.2)}`,
              fontSize: '0.75rem',
              color: withOpacity(brand.colors.secondary, 0.8),
              overflowX: 'auto',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 6 }}>Stacktrace</strong>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{details.stack}</pre>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={primaryButtonStyle}
            data-testid="error-go-back"
          >
            ⬅️ Ga terug
          </button>
          <Link to="/" style={secondaryButtonStyle} data-testid="error-go-home">
            🏠 Naar start
          </Link>
        </div>
      </section>
    </div>
  )
}
