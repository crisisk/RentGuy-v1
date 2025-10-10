import React, { useState } from 'react'
import { api, setToken } from './api.js'
import { brand, brandFontStack, withOpacity } from './branding.js'
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
        padding: '48px 16px',
        background: brand.colors.gradient,
        fontFamily: brandFontStack,
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '28px',
          maxWidth: 960,
          width: '100%',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          background: withOpacity('#ffffff', 0.94),
          boxShadow: '0 28px 80px rgba(21, 14, 40, 0.22)',
          borderRadius: 24,
          padding: '48px 56px',
          border: `1px solid ${withOpacity('#ffffff', 0.35)}`,
        }}
      >
        <section style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <span style={{fontSize: '0.85rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: brand.colors.mutedText}}>
            {brand.shortName} Onboarding
          </span>
          <h1 style={{margin: 0, fontSize: '2.4rem', color: brand.colors.secondary, lineHeight: 1.1}}>
            Welkom bij de MR-DJ cockpit
          </h1>
          <p style={{margin: 0, color: brand.colors.mutedText, fontSize: '1.05rem', maxWidth: 420}}>
            Meld je aan om de volledige MR-DJ workflow te activeren: planner, crew, warehouse en billing.
            We hebben de standaard templates alvast in jullie huisstijl gezet.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: '16px 20px',
              background: withOpacity(brand.colors.accent, 0.14),
              borderRadius: 16,
              border: `1px solid ${withOpacity(brand.colors.accent, 0.35)}`,
              color: brand.colors.secondary,
            }}
          >
            <strong style={{fontSize: '0.95rem'}}>Demo accounts</strong>
            <div style={{display: 'grid', gap: 8}}>
              <CredentialHint label="Bart – Operations" username="bart" password="mr-dj" description="Toegang tot alle MR-DJ modules." />
              <CredentialHint label="Demo – Finance" username="rentguy" password="rentguy" description="Focus op facturatie en rapportages." />
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
              Bekijk mr-dj.nl voor klantenstories →
            </a>
          </div>
        </section>
        <section
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '32px 28px',
            border: `1px solid ${withOpacity(brand.colors.mutedText, 0.12)}`,
            boxShadow: '0 18px 40px rgba(13, 8, 26, 0.12)',
          }}
        >
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 18}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <label htmlFor="username" style={{fontWeight: 600, color: brand.colors.secondary}}>Gebruikersnaam</label>
              <input
                id="username"
                value={user}
                onChange={e=>setUser(e.target.value)}
                placeholder="bijv. bart"
                style={inputStyle}
                autoComplete="username"
              />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <label htmlFor="password" style={{fontWeight: 600, color: brand.colors.secondary}}>Wachtwoord</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
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
                background: brand.colors.primary,
                color: '#fff',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isSubmitting
                  ? 'none'
                  : '0 16px 30px rgba(255, 45, 146, 0.35)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Momentje…' : '🎧 Start jouw MR-DJ sessie'}
            </button>
            {error && (
              <p style={{
                margin: 0,
                background: withOpacity('#ff5f7a', 0.14),
                borderRadius: 12,
                padding: '12px 16px',
                color: '#b91c1c',
                fontSize: '0.95rem',
              }}>
                {error}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid rgba(54, 46, 86, 0.12)',
  background: withOpacity('#f7f5ff', 0.8),
  fontSize: '1rem',
  outline: 'none',
  transition: 'border 0.2s ease, box-shadow 0.2s ease',
}

function CredentialHint({ label, username, password, description }) {
  return (
    <div style={{display: 'grid', gap: 4}}>
      <div style={{fontWeight: 600}}>{label}</div>
      <div style={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.9rem'}}>
        user: <code>{username}</code> • password: <code>{password}</code>
      </div>
      {description && <span style={{fontSize: '0.85rem', color: brand.colors.mutedText}}>{description}</span>}
    </div>
  )
}
