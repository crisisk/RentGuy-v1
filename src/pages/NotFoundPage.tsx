import { useMemo, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { brand, headingFontStack, withOpacity } from '@ui/branding'

type Suggestion = {
  label: string
  description: string
  href: string
}

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  padding: '64px 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `radial-gradient(circle at top, ${withOpacity(brand.colors.primary, 0.12)} 0%, transparent 52%) ${brand.colors.appBackground}`,
  fontFamily: brand.fontStack,
  color: brand.colors.secondary,
}

const cardStyle: CSSProperties = {
  width: 'min(640px, 100%)',
  display: 'grid',
  gap: 28,
  padding: '40px clamp(20px, 5vw, 44px)',
  borderRadius: 32,
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.85) 100%)',
  border: `1px solid ${withOpacity('#FFFFFF', 0.14)}`,
  color: '#ffffff',
  boxShadow: '0 38px 68px rgba(15, 23, 42, 0.45)',
}

const buttonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '12px 20px',
  borderRadius: 999,
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  textDecoration: 'none',
}

export default function NotFoundPage(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  const suggestions: Suggestion[] = useMemo(
    () => [
      {
        label: 'Dashboard',
        description: 'Bekijk de planner en AI-suggesties voor openstaande projecten.',
        href: '/planner',
      },
      {
        label: 'Facturen',
        description: 'Controleer openstaande facturen en recente betalingen.',
        href: '/finance',
      },
      {
        label: 'Secrets-dashboard',
        description: 'Beheer API-keys, SMTP en andere omgevingsvariabelen.',
        href: '/secrets',
      },
    ],
    [],
  )

  return (
    <div style={containerStyle}>
      <article style={cardStyle} role="status" aria-live="polite">
        <header style={{ display: 'grid', gap: 12 }}>
          <span aria-hidden style={{ fontSize: '2.8rem', lineHeight: 1 }}>🧭</span>
          <div style={{ display: 'grid', gap: 8 }}>
            <span
              style={{
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontSize: '0.78rem',
                color: withOpacity('#FFFFFF', 0.75),
                fontWeight: 600,
              }}
            >
              404 · Niet gevonden
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: headingFontStack,
                fontSize: '2.35rem',
                lineHeight: 1.1,
              }}
            >
              De gevraagde pagina bestaat niet
            </h1>
            <p style={{ margin: 0, color: withOpacity('#FFFFFF', 0.82) }}>
              We konden <code style={{ fontSize: '0.95rem' }}>{location.pathname || '/'}</code> niet vinden. Kies een volgende stap
              of ga terug naar het dashboard.
            </p>
          </div>
        </header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              ...buttonBase,
              background: '#ffffff',
              color: brand.colors.secondary,
              border: 'none',
            }}
            data-testid="not-found-back"
          >
            ⬅️ Ga terug
          </button>
          <Link
            to="/"
            style={{
              ...buttonBase,
              border: `1px solid ${withOpacity('#FFFFFF', 0.28)}`,
              color: '#ffffff',
              background: 'transparent',
            }}
            data-testid="not-found-home"
          >
            🏠 Naar start
          </Link>
        </div>

        <section aria-label="Aanbevolen bestemmingen" style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Misschien zocht je dit</h2>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: 12,
            }}
          >
            {suggestions.map(suggestion => (
              <li key={suggestion.href}>
                <Link
                  to={suggestion.href}
                  style={{
                    display: 'grid',
                    gap: 6,
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: withOpacity('#FFFFFF', 0.08),
                    border: `1px solid ${withOpacity('#FFFFFF', 0.16)}`,
                    color: '#ffffff',
                    textDecoration: 'none',
                  }}
                  data-testid={`suggestion-${suggestion.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                >
                  <span style={{ fontWeight: 600 }}>{suggestion.label}</span>
                  <span style={{ fontSize: '0.9rem', color: withOpacity('#FFFFFF', 0.8) }}>
                    {suggestion.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  )
}
