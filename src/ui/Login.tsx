import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { login, deriveLoginErrorMessage, ensureAuthEmail, type AuthUser } from '@application/auth/api'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import { resolveSupportConfig } from './experienceConfig'
import FlowExperienceShell from '@ui/FlowExperienceShell'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'
import { createFlowNavigation } from '@ui/flowNavigation'

type AuthView = 'login' | 'register' | 'reset-request' | 'reset-confirm'

export interface LoginProps {
  onLogin: (token: string, user: AuthUser) => void
  initialMode?: AuthView
  initialResetToken?: string
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

const loginBreadcrumbs = [
  { id: 'home', label: 'Pilot start', href: '/' },
  { id: 'login', label: 'Inloggen' },
]

const loginPersona = {
  name: 'Gastgebruiker',
  role: 'Pilot toegang',
  meta: 'Kies een persona na succesvolle login',
}

export function Login({ onLogin, initialMode = 'login', initialResetToken = '' }: LoginProps) {
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [view, setView] = useState<AuthView>(initialMode)
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [registerErrors, setRegisterErrors] = useState<string[]>([])
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState('')
  const [resetError, setResetError] = useState('')
  const [isRequestingReset, setIsRequestingReset] = useState(false)
  const [resetToken, setResetToken] = useState(initialResetToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const support = useMemo(() => resolveSupportConfig(), [])
  const helpCenterUrl = support.helpCenterBaseUrl
  const statusPageUrl = support.statusPageUrl

  useEffect(() => {
    setView(initialMode)
  }, [initialMode])

  useEffect(() => {
    setResetToken(initialResetToken)
  }, [initialResetToken])

  const handleScrollToForm = useCallback(() => {
    if (typeof document === 'undefined') {
      return
    }
    const form = document.getElementById('login-form')
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const fieldId =
      view === 'register'
        ? 'register-email'
        : view === 'reset-request'
          ? 'reset-email'
          : view === 'reset-confirm'
            ? 'new-password'
            : 'login-user'
    const targetField = document.getElementById(fieldId) as HTMLInputElement | null
    if (targetField && typeof targetField.focus === 'function') {
      targetField.focus({ preventScroll: true })
    }
  }, [view])

  const stage = useMemo(
    () => ({
      label: 'Authenticatie & toegang',
      status: 'in-progress' as const,
      detail: error ? 'Controleer je gegevens en probeer opnieuw.' : 'Gebruik SSO of een demo-account om verder te gaan.',
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
              'Toegang tot de pilot activeert automatisch explainers, auditlogs en monitoring voor alle persona\'s.',
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
          Bekijk de release notes en FAQ voor de laatste pilotwijzigingen of open een supportticket voor directe hulp.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href={helpCenterUrl} target="_blank" rel="noreferrer" style={footerLinkStyle}>
            Helpcenter
          </a>
          <a href={statusPageUrl} target="_blank" rel="noreferrer" style={footerLinkStyle}>
            Statuspagina
          </a>
        </div>
      </div>
    ),
    [helpCenterUrl, statusPageUrl],
  )

  const credentialList = useMemo(
    () => <FlowExplainerList tone="dark" items={credentialExplainers} minWidth={200} />,
    [],
  )

  const navigationRail = useMemo(
    () => ({
      title: 'Pilot gebruikersflows',
      caption:
        'Doorloop de flows in volgorde om explainers, dashboards en go-live checks automatisch te activeren.',
      items: createFlowNavigation(
        'login',
        { secrets: 'blocked' },
        {
          login: (
            <span>
              Actieve demo: <strong>{resolveEmail(user)}</strong>
            </span>
          ),
          role: 'Kies je persona zodra de login is gelukt.',
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

  const validateEmail = useCallback((value: string) => {
    if (!value || value.trim().length === 0) {
      return 'E-mail is verplicht'
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!pattern.test(value.trim())) {
      return 'Ongeldig e-mailadres'
    }
    return ''
  }, [])

  const validatePassword = useCallback((value: string, { allowEmpty = false }: { allowEmpty?: boolean } = {}) => {
    if (!value || value.trim().length === 0) {
      return allowEmpty ? '' : 'Wachtwoord is verplicht'
    }
    if (value.trim().length < 8) {
      return 'Wachtwoord moet minimaal 8 tekens bevatten'
    }
    return ''
  }, [])

  const showLoginView = useCallback((options: { preserveResetStatus?: boolean } = {}) => {
    setView('login')
    setRegisterErrors([])
    setRegisterSuccess('')
    if (!options.preserveResetStatus) {
      setResetStatus('')
    }
    setResetError('')
    setConfirmError('')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const showRegisterView = useCallback(() => {
    setView('register')
    setRegisterErrors([])
    setRegisterSuccess('')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/register')
    }
  }, [])

  const showResetRequestView = useCallback(() => {
    setView('reset-request')
    setResetStatus('')
    setResetError('')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/password-reset')
    }
  }, [])

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
        setError(result.error.message || deriveLoginErrorMessage(result.error))
      }
    } catch (err) {
      console.error('Onverwachte loginfout', err)
      setError('Login mislukt. Controleer gegevens.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const errors: string[] = []
      const emailError = validateEmail(registerEmail)
      const passwordError = validatePassword(registerPassword)
      if (emailError) {
        errors.push(emailError)
      }
      if (passwordError) {
        errors.push(passwordError)
      }
      if (!hasAcceptedTerms) {
        errors.push('Je moet de voorwaarden accepteren')
      }
      if (errors.length > 0) {
        setRegisterErrors(errors)
        setRegisterSuccess('')
        return
      }
      setRegisterErrors([])
      setIsRegistering(true)
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: registerEmail.trim(), password: registerPassword.trim() }),
        })
        if (!response.ok) {
          throw new Error('Registratie mislukt')
        }
        setRegisterSuccess('Account succesvol aangemaakt')
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/verify-email')
        }
      } catch (registerError) {
        console.error('Registratie mislukt', registerError)
        setRegisterErrors(['Registratie mislukt. Probeer het opnieuw.'])
      } finally {
        setIsRegistering(false)
      }
    },
    [hasAcceptedTerms, registerEmail, registerPassword, validateEmail, validatePassword],
  )

  const handleResetSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const emailError = validateEmail(resetEmail)
      if (emailError) {
        setResetError(emailError)
        setResetStatus('')
        return
      }
      setResetError('')
      setIsRequestingReset(true)
      try {
        const response = await fetch('/api/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.trim() }),
        })
        if (!response.ok) {
          throw new Error('Reset mislukt')
        }
        setResetStatus('Reset link verzonden')
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/password-reset/sent')
        }
      } catch (resetErrorCause) {
        console.error('Reset verzoek mislukt', resetErrorCause)
        setResetError('Kon geen resetlink versturen. Probeer het opnieuw.')
      } finally {
        setIsRequestingReset(false)
      }
    },
    [resetEmail, validateEmail],
  )

  const handleConfirmSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!resetToken) {
        setConfirmError('Reset token ontbreekt. Vraag een nieuwe link aan.')
        return
      }
      const passwordError = validatePassword(newPassword)
      if (passwordError) {
        setConfirmError(passwordError)
        return
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setConfirmError('Wachtwoorden komen niet overeen')
        return
      }
      setConfirmError('')
      setIsConfirmingReset(true)
      try {
        const response = await fetch('/api/password-reset/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password: newPassword.trim() }),
        })
        if (!response.ok) {
          throw new Error('Reset bevestigen mislukt')
        }
        setResetStatus('Wachtwoord succesvol gewijzigd')
        showLoginView({ preserveResetStatus: true })
      } catch (confirmErrorCause) {
        console.error('Reset bevestigen mislukt', confirmErrorCause)
        setConfirmError('Kon wachtwoord niet wijzigen. Probeer het opnieuw.')
      } finally {
        setIsConfirmingReset(false)
      }
    },
    [confirmPassword, newPassword, resetToken, showLoginView, validatePassword],
  )

  useEffect(() => {
    if (view === 'reset-confirm' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tokenParam = params.get('token') ?? ''
      if (tokenParam && tokenParam !== resetToken) {
        setResetToken(tokenParam)
      }
    }
  }, [resetToken, view])

  const renderLoginForm = () => (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Demo login</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Gebruik de demo-accounts om flows te testen. Tokens, onboardingprogressie en audit logs worden automatisch gevuld.
        </p>
      </div>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Gebruiker</span>
        <input
          id="login-user"
          data-testid="email-input"
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
          data-testid="password-input"
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
      {!error && resetStatus && (
        <p role="status" style={{ margin: 0, color: brand.colors.success, fontSize: '0.9rem' }}>
          {resetStatus}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          data-testid="register-link"
          onClick={showRegisterView}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.85),
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Nieuw account aanmaken
        </button>
        <button
          type="button"
          data-testid="forgot-password-link"
          onClick={showResetRequestView}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.75),
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Wachtwoord vergeten?
        </button>
      </div>
      <button
        type="submit"
        data-testid="login-button"
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
    </>
  )

  const renderRegisterForm = () => (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Registreren</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Maak een nieuw account aan voor toegang tot de pilotomgeving.
        </p>
      </div>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>E-mailadres</span>
        <input
          id="register-email"
          data-testid="email-input"
          value={registerEmail}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setRegisterEmail(event.target.value)}
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
          data-testid="password-input"
          value={registerPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setRegisterPassword(event.target.value)}
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
      <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="checkbox"
          data-testid="terms-checkbox"
          checked={hasAcceptedTerms}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setHasAcceptedTerms(event.target.checked)}
        />
        <span>Ik ga akkoord met de voorwaarden</span>
      </label>
      {registerErrors.length > 0 && (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: brand.colors.warning,
            fontSize: '0.85rem',
            display: 'grid',
            gap: 4,
          }}
        >
          {registerErrors.map(message => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {registerSuccess && (
        <p role="status" style={{ margin: 0, color: brand.colors.success, fontSize: '0.9rem' }}>
          {registerSuccess}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={showLoginView}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.8),
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Terug naar login
        </button>
        <button
          type="submit"
          data-testid="register-button"
          disabled={isRegistering}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundImage: brand.colors.gradient,
            color: '#0F172A',
            fontWeight: 700,
            cursor: isRegistering ? 'wait' : 'pointer',
            boxShadow: isRegistering ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.32)',
            opacity: isRegistering ? 0.75 : 1,
          }}
        >
          {isRegistering ? 'Registreren…' : 'Account aanmaken'}
        </button>
      </div>
    </>
  )

  const renderResetRequestForm = () => (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Reset wachtwoord</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
        </p>
      </div>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>E-mailadres</span>
        <input
          id="reset-email"
          data-testid="email-input"
          value={resetEmail}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setResetEmail(event.target.value)}
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
      {resetError && (
        <p role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.85rem' }}>
          {resetError}
        </p>
      )}
      {resetStatus && (
        <p role="status" style={{ margin: 0, color: brand.colors.success, fontSize: '0.9rem' }}>
          {resetStatus}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={showLoginView}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.8),
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Terug naar login
        </button>
        <button
          type="submit"
          data-testid="reset-request-button"
          disabled={isRequestingReset}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundImage: brand.colors.gradient,
            color: '#0F172A',
            fontWeight: 700,
            cursor: isRequestingReset ? 'wait' : 'pointer',
            boxShadow: isRequestingReset ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.32)',
            opacity: isRequestingReset ? 0.75 : 1,
          }}
        >
          {isRequestingReset ? 'Versturen…' : 'Stuur resetlink'}
        </button>
      </div>
    </>
  )

  const renderResetConfirmForm = () => (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Nieuw wachtwoord instellen</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Kies een nieuw wachtwoord voor je account.
        </p>
      </div>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Nieuw wachtwoord</span>
        <input
          type="password"
          id="new-password"
          data-testid="new-password-input"
          value={newPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setNewPassword(event.target.value)}
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
        <span style={{ fontWeight: 600 }}>Bevestig wachtwoord</span>
        <input
          type="password"
          data-testid="confirm-password-input"
          value={confirmPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
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
      {confirmError && (
        <p role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.85rem' }}>
          {confirmError}
        </p>
      )}
      {resetStatus && (
        <p role="status" style={{ margin: 0, color: brand.colors.success, fontSize: '0.9rem' }}>
          {resetStatus}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={showLoginView}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.8),
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Terug naar login
        </button>
        <button
          type="submit"
          data-testid="reset-confirm-button"
          disabled={isConfirmingReset}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundImage: brand.colors.gradient,
            color: '#0F172A',
            fontWeight: 700,
            cursor: isConfirmingReset ? 'wait' : 'pointer',
            boxShadow: isConfirmingReset ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.32)',
            opacity: isConfirmingReset ? 0.75 : 1,
          }}
        >
          {isConfirmingReset ? 'Opslaan…' : 'Wachtwoord opslaan'}
        </button>
      </div>
    </>
  )

  const formSubmitHandler =
    view === 'login'
      ? handleSubmit
      : view === 'register'
        ? handleRegisterSubmit
        : view === 'reset-request'
          ? handleResetSubmit
          : handleConfirmSubmit

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

      <form id="login-form" style={{ display: 'grid', gap: 18 }} onSubmit={formSubmitHandler}>
        {view === 'login'
          ? renderLoginForm()
          : view === 'register'
            ? renderRegisterForm()
            : view === 'reset-request'
              ? renderResetRequestForm()
              : renderResetConfirmForm()}
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
    <FlowExperienceShell
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
  if (candidate === 'bart') {
    return 'bart@rentguy.demo'
  }
  if (candidate === 'rentguy') {
    return 'rentguy@demo.local'
  }
  return `${candidate}@demo.local`
}

export default Login
