import { FormEvent, useCallback, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import { login, deriveLoginErrorMessage, ensureAuthEmail, type AuthUser } from '@application/auth/api'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import FlowExperienceShell from '@ui/FlowExperienceShell'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'
import { createFlowNavigation } from '@ui/flowNavigation'
import { getCurrentTenant } from '@/config/tenants'

export interface LoginProps {
  onLogin: (token: string, user: AuthUser) => void
}

const linkStyle: CSSProperties = {
  color: withOpacity('#ffffff', 0.82),
  textDecoration: 'none',
  fontWeight: 600,
}

const footerLinkStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 600,
  textDecoration: 'none',
}

const heroExplainers: FlowExplainerItem[] = [
  {
    id: 'branding',
    icon: '🎨',
    title: 'Co-branded ervaring',
    description:
      'Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd. Gebruikers ervaren dezelfde workflows als in de testomgeving.',
  },
  {
    id: 'observability',
    icon: '🛠️',
    title: 'Volledige audittrail',
    description:
      'Volledige audittrail van alle loginactiviteit. Test de monitoring- en herstelfuncties in de demo.',
  },
  {
    id: 'handover',
    icon: '🚀',
    title: 'End-to-end validatie',
    description:
      'Crew, finance en planning workflows zijn gekoppeld. Een succesvolle login activeert alle explainers en checklists.',
  },
]

function getCredentialExplainers(tenant: ReturnType<typeof getCurrentTenant>): FlowExplainerItem[] {
  // Determine password based on tenant
  const password = tenant?.id === 'mrdj' ? 'demo' : (tenant?.id === 'sevensa' ? 'sevensa' : 'demo')

  return [
    {
      id: 'account1',
      title: 'Operations Manager',
      description: 'Volledige toegang tot planning, teammanagement en onboarding.',
      meta: (
        <span>
          <strong>Gebruiker:</strong> {tenant?.customContent.demoAccount1 || 'bart'} · <strong>Wachtwoord:</strong> {password}
        </span>
      ),
    },
    {
      id: 'account2',
      title: 'Finance Manager',
      description: 'Facturen, voorschotten en KPI-monitoring om cashflow te testen.',
      meta: (
        <span>
          <strong>Gebruiker:</strong> {tenant?.customContent.demoAccount2 || 'rentguy'} · <strong>Wachtwoord:</strong> {password}
        </span>
      ),
    },
  ]
}

const loginJourney: FlowJourneyStep[] = [
  {
    id: 'login',
    title: '1. Inloggen',
    description: 'Log in met een demo-account of uw SSO-credentials om het platform te verkennen.',
    status: 'current',
  },
  {
    id: 'role',
    title: '2. Rol bevestigen',
    description: 'Selecteer uw rol om relevante hulp en dashboards te activeren.',
    status: 'upcoming',
  },
  {
    id: 'planner',
    title: '3. Planner cockpit',
    description: 'Stuur projecten, crew en materiaal. Alle workflows zijn vanuit hier bereikbaar.',
    status: 'upcoming',
    href: '/planner',
  },
  {
    id: 'secrets',
    title: '4. Configuratie & launch',
    description: 'Controleer integraties en monitoring voordat u naar productie promoveert.',
    status: 'upcoming',
    href: '/dashboard',
  },
]

const loginBreadcrumbs = [
  { id: 'home', label: 'Pilot start', href: '/' },
  { id: 'login', label: 'Inloggen' },
]

const loginPersona = {
  name: 'Gastgebruiker',
  role: 'Pilot toegang',
  meta: 'Kies een rol na succesvolle login',
}

interface SimpleLoginFormProps {
  user: string
  password: string
  error: string
  isSubmitting: boolean
  onUserChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onToggleGuided: () => void
}

function SimpleLoginForm({
  user,
  password,
  error,
  isSubmitting,
  onUserChange,
  onPasswordChange,
  onSubmit,
  onToggleGuided,
}: SimpleLoginFormProps) {
  const tenant = getCurrentTenant()
  return (
    <form
      id="login-form"
      style={{
        display: 'grid',
        gap: 18,
        maxWidth: 400,
        margin: '0 auto',
        padding: '24px',
        borderRadius: 18,
        background: withOpacity('#000000', 0.28),
        border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
      }}
      onSubmit={onSubmit}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack, fontSize: '1.5rem' }}>Login</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          {tenant?.customContent.loginWelcome || 'Enter your credentials to access the application.'}
        </p>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Email</span>
        <input
          type="email"
          name="email"
          id="email"
          value={resolveEmail(user)}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const email = event.target.value
            // If email contains @, use full email; otherwise use shorthand
            const value = email.includes('@') ? email : (email.split('@')[0] ?? '')
            onUserChange(value)
          }}
          autoComplete="email"
          required
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
        <span style={{ fontWeight: 600 }}>Password</span>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onPasswordChange(event.target.value)}
          autoComplete="current-password"
          required
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
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          type="button"
          onClick={onToggleGuided}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.82),
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: 0,
          }}
        >
          View onboarding guide
        </button>
      </div>
    </form>
  )
}

export function Login({ onLogin }: LoginProps) {
  const tenant = getCurrentTenant()
  const brandColor = tenant?.primaryColor || brand.colors.primary

  // Set default credentials based on tenant
  const defaultEmail = tenant?.customContent.demoAccount1 || 'bart'
  const defaultPassword = tenant?.id === 'mrdj' ? 'demo' : (tenant?.id === 'sevensa' ? 'sevensa' : 'demo')

  const [user, setUser] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'simple' | 'guided'>('simple')

  const handleScrollToForm = useCallback(() => {
    if (typeof document === 'undefined') {
      return
    }
    const form = document.getElementById('login-form')
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const userField = document.getElementById(viewMode === 'simple' ? 'email' : 'login-user') as HTMLInputElement | null
    if (userField && typeof userField.focus === 'function') {
      userField.focus({ preventScroll: true })
    }
  }, [viewMode])

  const stage = useMemo(
    () => ({
      label: 'Authenticatie & toegang',
      status: 'in-progress' as const,
      detail: error ? 'Controleer uw gegevens en probeer opnieuw.' : 'Gebruik SSO of een demo-account om verder te gaan.',
    }),
    [error],
  )

  const statusMessage = useMemo(
    () =>
      error
        ? {
            tone: 'danger' as const,
            title: 'Login mislukt',
            description: (
              <>
                {error}
                <br />
                Controleer gebruikersnaam en wachtwoord of kies een ander demoprofiel.
              </>
            ),
          }
        : {
            tone: 'info' as const,
            title: 'Welkom bij de pilotomgeving',
            description:
              'Toegang tot de pilot activeert automatisch explainers, auditlogs en monitoring voor alle rollen.',
          },
    [error],
  )

  const actions = useMemo(
    () => [
      {
        id: 'scroll-to-form',
        label: 'Ga naar loginformulier',
        variant: 'primary' as const,
        onClick: handleScrollToForm,
        icon: '🔐',
      },
      {
        id: 'contact-support',
        label: 'Mail pilot support',
        variant: 'ghost' as const,
        href: 'mailto:support@sevensa.nl?subject=RentGuy%20pilot%20login',
        icon: '✉️',
      },
    ],
    [handleScrollToForm],
  )

  const footerAside = useMemo(
    () => (
      <div style={{ display: 'grid', gap: 8 }}>
        <strong style={{ fontSize: '0.95rem' }}>Support & documentatie</strong>
        <p style={{ margin: 0, fontSize: '0.85rem', color: withOpacity('#FFFFFF', 0.82) }}>
          Bekijk de release notes en FAQ voor de laatste wijzigingen of open een supportticket voor directe hulp.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href={brand.provider.helpUrl ?? '#'} target="_blank" rel="noreferrer" style={footerLinkStyle}>
            Helpcenter
          </a>
          <a href={brand.provider.statusUrl ?? '#'} target="_blank" rel="noreferrer" style={footerLinkStyle}>
            Statuspagina
          </a>
        </div>
      </div>
    ),
    [],
  )

  const credentialList = useMemo(
    () => <FlowExplainerList tone="dark" items={getCredentialExplainers(tenant)} minWidth={200} />,
    [tenant],
  )

  const navigationRail = useMemo(
    () => ({
      title: 'Pilot gebruikersworkflows',
      caption:
        'Doorloop de workflows in volgorde om explainers, dashboards en go-live checks automatisch te activeren.',
      items: createFlowNavigation(
        'login',
        { secrets: 'blocked' },
        {
          login: (
            <span>
              Actieve demo: <strong>{resolveEmail(user)}</strong>
            </span>
          ),
          role: 'Kies uw rol zodra de login is gelukt.',
          planner: 'Ontgrendel de cockpit na rolbevestiging.',
          secrets: 'Alleen beschikbaar voor administrators na go-live staging.',
        },
      ),
      footer: (
        <span>
          Tip: Gebruik dezelfde volgorde tijdens demo- en training-sessies zodat auditlogs en monitoring de juiste context
          bevatten.
        </span>
      ),
    }),
    [user],
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

  const guidedFormContent = (
    <div style={{ display: 'grid', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 18,
          background: withOpacity('#000000', 0.28),
          border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
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
              Start met een operations of finance rol om meteen de specifieke explainers te ontgrendelen.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setViewMode('simple')}
          style={{
            background: 'none',
            border: `1px solid ${withOpacity('#FFFFFF', 0.25)}`,
            color: withOpacity('#ffffff', 0.82),
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
          }}
        >
          Simple view
        </button>
      </div>

      <form id="login-form" style={{ display: 'grid', gap: 18 }} onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Demo login</h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
            Gebruik de demo-accounts om workflows te testen. Tokens, onboardingprogressie en audit logs worden automatisch
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
          Over {brand.provider.name}
        </a>
        <a href={brand.tenant.url} target="_blank" rel="noreferrer" style={linkStyle}>
          Bekijk {brand.tenant.name}
        </a>
      </div>
    </div>
  )

  const heroAside = viewMode === 'simple' ? (
    <SimpleLoginForm
      user={user}
      password={password}
      error={error}
      isSubmitting={isSubmitting}
      onUserChange={setUser}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onToggleGuided={() => setViewMode('guided')}
    />
  ) : (
    guidedFormContent
  )

  return (
    <FlowExperienceShell
      layout="split"
      heroTone="dark"
      eyebrow="Pilotomgeving"
      heroBadge={`${brand.shortName} × ${brand.tenant.name}`}
      title={tenant?.customContent.heroTitle || 'Platform Dashboard'}
      description={
        <>
          {tenant?.customContent.heroSubtitle && (
            <span>
              {tenant.customContent.heroSubtitle}
            </span>
          )}
          <span>
            Dit is de co-branded omgeving voor uw organisatie. We combineren {brand.provider.name} governance met uw merkidentiteit zodat uw team de planning, crew en facturatie end-to-end kan testen.
          </span>
          <span>
            Elk roldashboard bevat explainers en best practices zodat testsessies en go-live readiness objectief aantoonbaar zijn.
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
      breadcrumbs={loginBreadcrumbs}
      persona={loginPersona}
      stage={stage}
      actions={actions}
      statusMessage={statusMessage}
      footerAside={footerAside}
      navigationRail={navigationRail}
    />
  )
}

function resolveEmail(candidate: string): string {
  // If already an email (contains @), return as-is
  if (candidate.includes('@')) {
    return candidate
  }

  // Legacy shortcuts for backwards compatibility
  if (candidate === 'bart') {
    return 'bart@rentguy.demo'
  }
  if (candidate === 'rentguy') {
    return 'rentguy@demo.local'
  }

  // Default: assume it's a shorthand and add demo domain
  return `${candidate}@demo.local`
}

export default Login
