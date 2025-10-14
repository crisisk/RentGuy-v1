import { FormEvent, useState, type CSSProperties } from 'react'
import { api, setToken } from './api'
import { brand, brandFontStack, headingFontStack, withOpacity } from './branding'
import { setLocalStorageItem } from './storage'

export interface LoginProps {
  onLogin: (token: string, email?: string) => void
}

interface CredentialHintProps {
  label: string
  username: string
  password: string
  description: string
}

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
] as const

const linkStyle: CSSProperties = {
  color: withOpacity('#ffffff', 0.82),
  textDecoration: 'none',
  fontWeight: 600,
}

function CredentialHint({ label, username, password, description }: CredentialHintProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 14px',
        borderRadius: 16,
        background: withOpacity('#000000', 0.22),
        border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
      }}
    >
      <strong style={{ color: '#fff', fontSize: '0.9rem', letterSpacing: '0.04em' }}>{label}</strong>
      <span style={{ color: withOpacity('#ffffff', 0.75), fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 600 }}>Gebruiker:</span> {username} · <span style={{ fontWeight: 600 }}>Wachtwoord:</span> {password}
      </span>
      <span style={{ color: withOpacity('#ffffff', 0.7), fontSize: '0.82rem' }}>{description}</span>
    </div>
  )
}

export function Login({ onLogin }: LoginProps) {
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      let email: string
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
      const { data } = await api.post<{ access_token: string }>('/api/v1/auth/login', form)
      setToken(data.access_token)
      setLocalStorageItem('user_email', email)
      onLogin(data.access_token, email)
    } catch (err) {
      console.error('Login mislukt', err)
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
            borderRadius: 28,
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            boxShadow: '0 24px 64px rgba(15, 23, 42, 0.2)',
            border: `1px solid ${withOpacity('#0F172A', 0.12)}`,
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>Demo login</h2>
            <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity(brand.colors.secondary, 0.72) }}>
              Gebruik de demo-accounts om flows te testen. We genereren automatisch tokens, onboardingprogressie en audit logs.
            </p>
          </div>
          <form style={{ display: 'grid', gap: 16 }} onSubmit={handleSubmit}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, color: brand.colors.secondary }}>Gebruiker</span>
              <input
                value={user}
                onChange={event => setUser(event.target.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                  fontSize: '0.95rem',
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, color: brand.colors.secondary }}>Wachtwoord</span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                  fontSize: '0.95rem',
                }}
              />
            </label>
            {error && (
              <p role="alert" style={{ margin: 0, color: brand.colors.danger, fontSize: '0.85rem' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 8,
                padding: '12px 18px',
                borderRadius: 999,
                border: 'none',
                backgroundImage: brand.colors.gradient,
                color: '#fff',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
                boxShadow: isSubmitting ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.24)',
                opacity: isSubmitting ? 0.75 : 1,
              }}
            >
              {isSubmitting ? 'Inloggen…' : 'Inloggen'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Login
