import React, { useEffect, useMemo, useState } from 'react'
import { api, setToken } from './api.js'
import { brand, brandFontStack, withOpacity } from './theme.js'
import { setLocalStorageItem } from './storage.js'

const credentialHints = [
  {
    id: 'ops',
    label: 'Sevensa Operations',
    username: 'bart',
    password: 'mr-dj',
    description: 'Volledige toegang tot cockpit en AI-rapportages.',
  },
  {
    id: 'finance',
    label: 'Sevensa Finance',
    username: 'rentguy',
    password: 'rentguy',
    description: 'Gefocust op facturatie, compliance en cashflow.',
  },
]

export default function Login({ onLogin }) {
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brand.shortName} · Aanmelden`
    }
  }, [])

  const mappedEmail = useMemo(() => {
    if (!user) return ''
    if (user.includes('@')) return user.toLowerCase()
    if (user === 'bart') return 'bart@rentguy.demo'
    if (user === 'rentguy') return 'rentguy@demo.local'
    return `${user}@demo.local`
  }, [user])

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return
    setError('')
    setIsSubmitting(true)
    try {
      const { data } = await api.post('/api/v1/auth/login', {
        email: mappedEmail,
        password,
      })
      setToken(data.access_token)
      setLocalStorageItem('user_email', mappedEmail)
      onLogin(data.access_token, mappedEmail)
    } catch (err) {
      setError('Login mislukt. Controleer je gegevens en probeer opnieuw.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        background: brand.colors.gradient,
        fontFamily: brandFontStack,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 12% 20%, ${withOpacity('#ffffff', 0.18)} 0%, transparent 45%), radial-gradient(circle at 88% 16%, ${withOpacity('#ffffff', 0.12)} 0%, transparent 55%)`,
          zIndex: 0,
        }}
      />
      <div
        style={{
          display: 'grid',
          gap: '32px',
          maxWidth: 1040,
          width: '100%',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          background: withOpacity('#ffffff', 0.92),
          boxShadow: brand.colors.shadow,
          borderRadius: 28,
          padding: '48px 56px',
          border: `1px solid ${withOpacity('#ffffff', 0.45)}`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              aria-hidden
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: `conic-gradient(from 160deg, ${brand.colors.primary}, ${brand.colors.primaryDark}, ${brand.colors.accent})`,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 16px 40px rgba(33, 52, 61, 0.35)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.85rem',
                letterSpacing: '-0.04em',
              }}
            >
              S
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: brand.colors.secondary,
                }}
              >
                Sevensa Platform
              </span>
              <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.28em', color: brand.colors.mutedText }}>
                {brand.tagline}
              </span>
            </div>
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: brand.colors.secondary, lineHeight: 1.1 }}>
            Welkom bij het {brand.name}
          </h1>
          <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '1.05rem', maxWidth: 420 }}>
            Meld je aan om de AI-gedreven operations cockpit te openen. Beheer projecten, resources en inzichten vanuit één vertrouwd scherm.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              padding: '18px 22px',
              background: withOpacity(brand.colors.accent, 0.16),
              borderRadius: 18,
              border: `1px solid ${withOpacity(brand.colors.accent, 0.38)}`,
              color: brand.colors.secondary,
            }}
          >
            <strong style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo accounts</strong>
            <div style={{ display: 'grid', gap: 10 }}>
              {credentialHints.map(hint => (
                <CredentialHint key={hint.id} {...hint} />
              ))}
            </div>
            <a
              href={brand.url}
              target="_blank"
              rel="noreferrer"
              style={{
                color: brand.colors.primaryDark,
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Ontdek meer over Sevensa →
            </a>
          </div>
        </section>
        <section
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '36px 32px',
            border: `1px solid ${brand.colors.outline}`,
            boxShadow: '0 18px 42px rgba(13, 59, 102, 0.18)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="username" style={{ fontWeight: 600, color: brand.colors.secondary }}>E-mailadres of gebruikersnaam</label>
              <input
                id="username"
                value={user}
                onChange={event => setUser(event.target.value)}
                placeholder="bijv. bart"
                style={inputStyle}
                autoComplete="username"
                aria-describedby="login-username-help"
              />
              <span id="login-username-help" style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>
                We vullen automatisch het juiste demo-adres in.
              </span>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="password" style={{ fontWeight: 600, color: brand.colors.secondary }}>Wachtwoord</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="mr-dj"
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '14px 18px',
                borderRadius: 999,
                backgroundImage: brand.colors.gradient,
                color: '#fff',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                boxShadow: isSubmitting ? 'none' : '0 20px 40px rgba(11, 197, 234, 0.32)',
                opacity: isSubmitting ? 0.75 : 1,
              }}
            >
              {isSubmitting ? 'Momentje…' : 'Inloggen en starten'}
            </button>
            <div aria-live="assertive" style={{ minHeight: 24 }}>
              {error && (
                <p
                  style={{
                    margin: 0,
                    background: withOpacity(brand.colors.danger, 0.12),
                    borderRadius: 14,
                    padding: '12px 16px',
                    color: '#B71C1C',
                    fontSize: '0.95rem',
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 14,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.28)}`,
  background: withOpacity(brand.colors.surfaceMuted, 0.65),
  fontSize: '1rem',
  outline: 'none',
  color: brand.colors.secondary,
  boxShadow: '0 0 0 1px transparent',
  transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
}

function CredentialHint({ label, username, password, description }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 6,
        padding: '12px 14px',
        borderRadius: 14,
        border: `1px solid ${withOpacity(brand.colors.primary, 0.25)}`,
        background: withOpacity('#ffffff', 0.72),
      }}
    >
      <div style={{ fontWeight: 600, color: brand.colors.secondary }}>{label}</div>
      <div
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '0.9rem',
          color: brand.colors.primaryDark,
        }}
      >
        user: <code>{username}</code> • password: <code>{password}</code>
      </div>
      {description && <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{description}</span>}
    </div>
  )
}
