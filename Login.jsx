import React, { useState } from 'react'
import { api, setToken } from './api.js'
import { brand, brandFontStack, headingFontStack, withOpacity } from './branding.js'

const heroHighlights = [
  {
    title: 'Mr. DJ branding klaar voor productie',
    description:
      'Gradient, tone-of-voice en pakketten zijn voorgeladen zodat Bart direct een herkenbare ervaring ziet.',
  },
  {
    title: 'Corporate Sevensa borging',
    description:
      'Elke stap logt audit events, ondersteunt UAT-scenario’s en blijft white-labelbaar voor nieuwe klanten.',
  },
  {
    title: 'Facturatie en planning verbonden',
    description:
      'Invoice Ninja, Mollie en crewbriefings zijn gekoppeld aan RentGuy milestones voor volledige traceerbaarheid.',
  },
]
import { setLocalStorageItem } from './storage.js'

export default function Login({ onLogin }) {
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      // Map username to email format
      let email
      if (user === 'bart') {
        email = 'bart@rentguy.demo'
      } else if (user === 'rentguy') {
        email = 'rentguy@demo.local'
      } else {
        email = `${user}@demo.local`
      }

      const form = new FormData()
      form.append('email', email)
      form.append('password', password)
      const { data } = await api.post('/api/v1/auth/login', form)
      setToken(data.access_token)
      setLocalStorageItem('user_email', email)
      onLogin(data.access_token, email)
    } catch (err) {
      setError('Login mislukt. Controleer gegevens.')
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
            `radial-gradient(circle at 12% 20%, ${withOpacity('#ffffff', 0.16)} 0%, transparent 45%), radial-gradient(circle at 88% 16%, ${withOpacity('#ffffff', 0.12)} 0%, transparent 55%)`,
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
          background: withOpacity('#0F172A', 0.35),
          boxShadow: brand.colors.shadow,
          borderRadius: 32,
          padding: '48px 54px',
          border: `1px solid ${withOpacity('#FFFFFF', 0.22)}`,
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(18px)',
        }}
      >
        <section style={{ display: 'grid', gap: 22 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: 999,
              background: withOpacity('#ffffff', 0.15),
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
            }}
          >
            {brand.shortName} × {brand.tenant.name}
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: '2.8rem',
              lineHeight: 1.1,
              color: '#ffffff',
              fontFamily: headingFontStack,
            }}
          >
            Activeer de Mister DJ beleving met Sevensa RentGuy
          </h1>
          <p style={{ margin: 0, color: withOpacity('#ffffff', 0.86), fontSize: '1.05rem', maxWidth: 520 }}>
            Dit is de co-branded omgeving voor onze eerste klant. We combineren Sevensa governance met de {brand.tenant.tagline.toLowerCase()} zodat Bart en team de planning, crew en facturatie end-to-end kunnen testen.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {heroHighlights.map(item => (
              <div
                key={item.title}
                style={{
                  display: 'grid',
                  gap: 6,
                  padding: '12px 14px',
                  borderRadius: 18,
                  background: withOpacity('#000000', 0.28),
                  border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
                }}
              >
                <strong style={{ color: '#fff', fontSize: '0.95rem', letterSpacing: '0.04em' }}>{item.title}</strong>
                <span style={{ color: withOpacity('#ffffff', 0.72), fontSize: '0.9rem' }}>{item.description}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gap: 14,
              padding: '18px 22px',
              background: withOpacity('#FFFFFF', 0.14),
              borderRadius: 20,
              border: `1px solid ${withOpacity('#FFFFFF', 0.2)}`,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 42,
                  height: 42,
                  borderRadius: 16,
                  background: brand.colors.softHighlight,
                  color: brand.colors.secondary,
                  fontWeight: 700,
                }}
              >
                ★
              </span>
              <div style={{ display: 'grid', gap: 2 }}>
                <strong style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.82rem' }}>Demo accounts</strong>
                <span style={{ color: withOpacity('#ffffff', 0.78), fontSize: '0.88rem' }}>
                  Log in als Bart (operations) of RentGuy (finance) om de flows van Mister DJ te valideren.
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <CredentialHint label="Bart · Operations" username="bart" password="mr-dj" description="Complete planner, crewmatching en onboardingchecklist." />
              <CredentialHint label="RentGuy · Finance" username="rentguy" password="rentguy" description="Facturen, voorschotten en KPI-monitoring voor UAT." />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: withOpacity('#ffffff', 0.7) }}>
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
              Sign-in
            </span>
            <h2 style={{ margin: 0, color: brand.colors.secondary, fontFamily: headingFontStack }}>
              {brand.tenant.name} toegang
            </h2>
            <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.95rem' }}>
              Gebruik de gedeelde demo-accounts om onboarding scenario’s en audits van Sevensa te testen.
            </p>
          </header>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="username" style={{ fontWeight: 600, color: brand.colors.secondary }}>E-mailadres of gebruikersnaam</label>
              <input
                id="username"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="bijv. bart"
                style={inputStyle}
                autoComplete="username"
              />
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="password" style={{ fontWeight: 600, color: brand.colors.secondary }}>Wachtwoord</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
                boxShadow: isSubmitting
                  ? 'none'
                  : '0 24px 48px rgba(79, 70, 229, 0.25)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Momentje…' : 'Inloggen en starten'}
            </button>
            {error && (
              <p style={{
                margin: 0,
                background: withOpacity(brand.colors.danger, 0.12),
                borderRadius: 16,
                padding: '12px 16px',
                color: '#B91C1C',
                fontSize: '0.95rem',
              }}>
                {error}
              </p>
            )}
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
        border: `1px solid ${withOpacity('#FFFFFF', 0.2)}`,
        background: withOpacity('#000000', 0.18),
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
