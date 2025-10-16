import { FormEvent, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import { login, deriveLoginErrorMessage, ensureAuthEmail, type AuthUser } from '@application/auth/api'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import ExperienceLayout from '@ui/ExperienceLayout'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'

export interface LoginProps {
  onLogin: (token: string, user: AuthUser) => void
}

const linkStyle: CSSProperties = {
  color: withOpacity('#ffffff', 0.82),
  textDecoration: 'none',
  fontWeight: 600,
}

const heroExplainers: FlowExplainerItem[] = [
  {
    id: 'branding',
    icon: '🎨',
    title: 'Co-branded ervaring',
    description:
      'Het Mister DJ merk en Sevensa governance lopen synchroon. Zo ziet Bart precies dezelfde flows als tijdens UAT.',
  },
  {
    id: 'observability',
    icon: '🛠️',
    title: 'Volledige audittrail',
    description:
      'Elke login triggert audit events en dashboards. Gebruik de demo om de monitoring- en rollbackscenario’s te verifiëren.',
  },
  {
    id: 'handover',
    icon: '🚀',
    title: 'End-to-end validatie',
    description:
      'Crew, finance en planning flows zijn gekoppeld. Een succesvolle login activeert alle explainers en checklists.',
  },
]

const credentialExplainers: FlowExplainerItem[] = [
  {
    id: 'bart',
    title: 'Bart · Operations',
    description: 'Compleet planner-, crew- en onboardingdomein voor de Mister DJ pilot.',
    meta: (
      <span>
        <strong>Gebruiker:</strong> bart · <strong>Wachtwoord:</strong> mr-dj
      </span>
    ),
  },
  {
    id: 'rentguy',
    title: 'RentGuy · Finance',
    description: 'Facturen, voorschotten en KPI-monitoring om cashflow te testen.',
    meta: (
      <span>
        <strong>Gebruiker:</strong> rentguy · <strong>Wachtwoord:</strong> rentguy
      </span>
    ),
  },
]

const loginJourney: FlowJourneyStep[] = [
  {
    id: 'login',
    title: '1. Inloggen',
    description: 'Gebruik de demo-accounts of je Sevensa SSO om toegang te krijgen tot de pilot.',
    status: 'current',
  },
  {
    id: 'role',
    title: '2. Rol bevestigen',
    description: 'Kies een persona om de juiste dashboards en explainers te activeren.',
    status: 'upcoming',
  },
  {
    id: 'planner',
    title: '3. Planner cockpit',
    description: 'Stuur projecten, crew en materiaal. Alle persona-flows zijn vanuit hier bereikbaar.',
    status: 'upcoming',
    href: '/planner',
  },
  {
    id: 'secrets',
    title: '4. Configuratie & launch',
    description: 'Controleer integraties en monitoring voordat je naar productie promoveert.',
    status: 'upcoming',
    href: '/dashboard',
  },
]

export function Login({ onLogin }: LoginProps) {
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const credentialList = useMemo(
    () => <FlowExplainerList tone="dark" items={credentialExplainers} minWidth={200} />, 
    [],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const email = resolveEmail(user)
      const result = await login({ email, password })
      if (result.ok) {
        const { token, user: payloadUser } = result.value
        const ensuredEmail = ensureAuthEmail(payloadUser.email ?? email)
        const nextUser: AuthUser = {
          ...payloadUser,
          email: ensuredEmail,
        }
        onLogin(token, nextUser)
      } else {
        console.warn('Login mislukt', result.error)
        setError(deriveLoginErrorMessage(result.error))
      }
    } catch (err) {
      console.error('Onverwachte loginfout', err)
      setError('Login mislukt. Controleer gegevens.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const heroAside = (
    <div style={{ display: 'grid', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 18,
          background: withOpacity('#000000', 0.28),
          border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
          alignItems: 'center',
        }}
      >
        <span
          aria-hidden
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
            fontSize: '1.1rem',
          }}
        >
          ★
        </span>
        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.82rem' }}>Demo accounts</strong>
          <span style={{ color: withOpacity('#ffffff', 0.78), fontSize: '0.88rem' }}>
            Start als Bart (operations) of RentGuy (finance) om meteen de persona explainers te ontgrendelen.
          </span>
        </div>
      </div>

      <form style={{ display: 'grid', gap: 18 }} onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Demo login</h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
            Gebruik de demo-accounts om flows te testen. Tokens, onboardingprogressie en audit logs worden automatisch
            gevuld.
          </p>
        </div>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Gebruiker</span>
          <input
            id="login-user"
            value={user}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setUser(event.target.value)}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: `1px solid ${withOpacity('#FFFFFF', 0.25)}`,
              background: withOpacity('#000000', 0.25),
              color: '#ffffff',
              fontSize: '0.95rem',
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Wachtwoord</span>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: `1px solid ${withOpacity('#FFFFFF', 0.25)}`,
              background: withOpacity('#000000', 0.25),
              color: '#ffffff',
              fontSize: '0.95rem',
            }}
          />
        </label>
        {error && (
          <p role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.85rem' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: 4,
            padding: '12px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundImage: brand.colors.gradient,
            color: '#0F172A',
            fontWeight: 700,
            cursor: isSubmitting ? 'wait' : 'pointer',
            boxShadow: isSubmitting ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.32)',
            opacity: isSubmitting ? 0.75 : 1,
          }}
        >
          {isSubmitting ? 'Inloggen…' : 'Inloggen'}
        </button>
      </form>

      {credentialList}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: withOpacity('#ffffff', 0.7) }}>
        <a href={brand.provider.url} target="_blank" rel="noreferrer" style={linkStyle}>
          Over Sevensa
        </a>
        <a href={brand.tenant.url} target="_blank" rel="noreferrer" style={linkStyle}>
          Bekijk Mister DJ
        </a>
      </div>
    </div>
  )

  return (
    <ExperienceLayout
      layout="split"
      heroTone="dark"
      eyebrow="Pilotomgeving"
      heroBadge={`${brand.shortName} × ${brand.tenant.name}`}
      title="Activeer de Mister DJ beleving met Sevensa RentGuy"
      description={
        <>
          <span>
            Dit is de co-branded omgeving voor onze eerste klant. We combineren Sevensa governance met de {brand.tenant.tagline.toLowerCase()} zodat Bart en team de planning, crew en facturatie end-to-end kunnen testen.
          </span>
          <span>
            Elk persona dashboard bevat explainers en best practices zodat UAT-sessies en go-live readiness objectief aantoonbaar zijn.
          </span>
        </>
      }
      heroPrologue={<FlowExplainerList tone="dark" items={heroExplainers} minWidth={240} />}
      heroAside={heroAside}
      heroFooter={
        <FlowJourneyMap
          steps={loginJourney}
          subtitle="De aanbevolen volgorde zorgt ervoor dat explainers en dashboards met de juiste data geladen worden."
        />
      }
    />
  )
}

function resolveEmail(candidate: string): string {
  if (candidate === 'bart') {
    return 'bart@rentguy.demo'
  }
  if (candidate === 'rentguy') {
    return 'rentguy@demo.local'
  }
  return `${candidate}@demo.local`
}

export default Login
