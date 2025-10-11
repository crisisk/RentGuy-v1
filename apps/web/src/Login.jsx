import React, { useEffect, useMemo, useState } from 'react'
import { api, setToken } from './api.js'
import { brand, brandFontStack, headingFontStack, withOpacity } from './theme.js'
import { setLocalStorageItem } from './storage.js'

const heroHighlights = [
  {
    title: 'Feestklare planning',
    description:
      'Bekijk direct welke shows, lichtsets en backline er deze week op het programma staan. De cockpit bundelt agenda, crew en voorraad.',
  },
  {
    title: 'Bart’s snelle start',
    description:
      'Open Bart’s favoriete dashboard: actuele events, risico’s en shout-outs voor het team staan bovenaan in plaats van verstopt in lijstjes.',
  },
  {
    title: 'Van briefing tot aftermovie',
    description:
      'Crew-notities, draaiboeken en facturatie houden elkaar bij. Zo blijft de 100% Dansgarantie scherp én professioneel richting klanten.',
  },
]

const bartSpotlight = {
  title: 'Hallo Bart 👋',
  description:
    'We hebben de cockpit afgestemd op jouw Mister DJ workflow, zodat jij en het team meteen de juiste vibe te pakken hebben.',
  checklist: [
    'Check de weekendshows in de agenda-widget en pin de prioriteiten.',
    'Doorloop de gear check: alles met een ⚡️ heeft extra aandacht nodig.',
    'Laat een korte shout in de crewchat achter zodra alles klaar staat.',
  ],
}

const credentialHints = [
  {
    label: 'Bart · Operations',
    username: 'bart',
    password: 'mr-dj',
    description: 'Laat zien hoe de live planning, voorraad en crewchat samenkomen.',
  },
  {
    label: 'RentGuy · Finance',
    username: 'rentguy',
    password: 'rentguy',
    description: 'Valideer offertes, voorschotten en nacalculatie voor Mister DJ events.',
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
        padding: '56px 20px',
        background: brand.colors.appBackground,
        fontFamily: brandFontStack,
        position: 'relative',
        overflow: 'hidden',
        color: brand.colors.text,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 12% 18%, ${withOpacity('#ffffff', 0.18)} 0%, transparent 45%), radial-gradient(circle at 85% 12%, ${withOpacity('#ffffff', 0.12)} 0%, transparent 55%)`,
          mixBlendMode: 'screen',
          zIndex: 0,
        }}
      />
      <div
        style={{
          display: 'grid',
          gap: '40px',
          maxWidth: 1140,
          width: '100%',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          background: withOpacity('#0B1026', 0.38),
          boxShadow: brand.colors.shadow,
          borderRadius: 32,
          padding: '48px 54px',
          border: `1px solid ${withOpacity('#FFFFFF', 0.24)}`,
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
        }}
      >
        <section style={{ display: 'grid', gap: 22 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: 999,
              background: withOpacity('#ffffff', 0.16),
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
            }}
          >
            Sevensa ♥ Mister DJ
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: '2.75rem',
              lineHeight: 1.1,
              color: '#ffffff',
              fontFamily: headingFontStack,
            }}
          >
            Zet Mister DJ events in de spotlight met RentGuy
          </h1>
          <p style={{ margin: 0, color: withOpacity('#ffffff', 0.86), fontSize: '1.05rem', maxWidth: 560 }}>
            Alles wat je nodig hebt om shows soepel te draaien: planning, crewbriefings en finance afgestemd op Mister DJ.
            Start met de demo-accounts om de hele groove te doorlopen voordat je live gaat.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {heroHighlights.map(item => (
              <div
                key={item.title}
                style={{
                  display: 'grid',
                  gap: 6,
                  padding: '12px 16px',
                  borderRadius: 18,
                  background: withOpacity('#000000', 0.24),
                  border: `1px solid ${withOpacity('#FFFFFF', 0.22)}`,
                }}
              >
                <strong style={{ color: '#fff', fontSize: '0.95rem', letterSpacing: '0.04em' }}>{item.title}</strong>
                <span style={{ color: withOpacity('#ffffff', 0.78), fontSize: '0.9rem' }}>{item.description}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gap: 10,
              padding: '18px 20px',
              borderRadius: 20,
              background: withOpacity('#000000', 0.22),
              border: `1px solid ${withOpacity('#FFFFFF', 0.24)}`,
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ color: '#fff', fontSize: '1rem', letterSpacing: '0.05em' }}>{bartSpotlight.title}</strong>
              <span style={{ color: withOpacity('#ffffff', 0.82), fontSize: '0.9rem' }}>{bartSpotlight.description}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, color: withOpacity('#ffffff', 0.78), fontSize: '0.88rem' }}>
              {bartSpotlight.checklist.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div
            style={{
              display: 'grid',
              gap: 14,
              padding: '18px 22px',
              background: withOpacity('#FFFFFF', 0.16),
              borderRadius: 20,
              border: `1px solid ${withOpacity('#FFFFFF', 0.26)}`,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  background: brand.colors.softHighlight,
                  color: brand.colors.secondary,
                  fontWeight: 700,
                }}
              >
                ★
              </span>
              <div style={{ display: 'grid', gap: 2 }}>
                <strong style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.82rem' }}>
                  Demo accounts
                </strong>
                <span style={{ color: withOpacity('#ffffff', 0.78), fontSize: '0.88rem' }}>
                  Kies het profiel dat je nodig hebt om de voorbereiding van de shows stap voor stap te testen.
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {credentialHints.map(hint => (
                <CredentialHint key={hint.username} {...hint} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: withOpacity('#ffffff', 0.74) }}>
              <a href={brand.provider.url} target="_blank" rel="noreferrer" style={linkStyle}>
                Over Sevensa
              </a>
              <a href={brand.tenant.url} target="_blank" rel="noreferrer" style={linkStyle}>
                Bekijk Mister DJ
              </a>
            </div>
          </div>
        </section>
        <section
          style={{
            background: '#ffffff',
            borderRadius: 26,
            padding: '40px 34px',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.22)}`,
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
            display: 'grid',
            gap: 24,
          }}
        >
          <header style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: brand.colors.mutedText, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              Aanmelden
            </span>
            <h2 style={{ margin: 0, color: brand.colors.secondary, fontFamily: headingFontStack }}>
              {brand.tenant.name} toegang
            </h2>
            <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.95rem' }}>
              Gebruik de demo-accounts om de Mister DJ ervaring te doorlopen, van planning tot aftermovie.
            </p>
          </header>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="username" style={{ fontWeight: 600, color: brand.colors.secondary }}>
                E-mailadres of gebruikersnaam
              </label>
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
                padding: '14px 20px',
                borderRadius: 999,
                backgroundImage: brand.colors.gradient,
                color: '#fff',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                boxShadow: isSubmitting ? 'none' : '0 24px 48px rgba(124, 58, 237, 0.28)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Momentje…' : 'Inloggen & show starten'}
            </button>
            <div aria-live="assertive" style={{ minHeight: 24 }}>
              {error && (
                <p
                  style={{
                    margin: 0,
                    background: withOpacity(brand.colors.danger, 0.12),
                    borderRadius: 16,
                    padding: '12px 16px',
                    color: '#B91C1C',
                    fontSize: '0.95rem',
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </form>
          <footer style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>
            © 2025 {brand.provider.name} · {brand.tenant.name} tenant build · {brand.partnerTagline}
          </footer>
        </section>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 14,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.32)}`,
  background: withOpacity('#F8FAFF', 0.92),
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
        borderRadius: 16,
        border: `1px solid ${withOpacity('#FFFFFF', 0.22)}`,
        background: withOpacity('#000000', 0.2),
      }}
    >
      <div style={{ fontWeight: 600, color: '#ffffff' }}>{label}</div>
      <div
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '0.9rem',
          color: withOpacity('#ffffff', 0.88),
        }}
      >
        user: <code>{username}</code> • password: <code>{password}</code>
      </div>
      {description && <span style={{ fontSize: '0.85rem', color: withOpacity('#ffffff', 0.76) }}>{description}</span>}
    </div>
  )
}

const linkStyle = {
  color: '#ffffff',
  textDecoration: 'underline',
  fontWeight: 600,
  textUnderlineOffset: 6,
}
