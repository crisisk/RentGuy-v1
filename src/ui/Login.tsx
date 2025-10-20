import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import {
  confirmPasswordReset,
  deriveLoginErrorMessage,
  derivePasswordResetErrorMessage,
  deriveRegisterErrorMessage,
  ensureAuthEmail,
  login,
  registerUser,
  requestPasswordReset,
  type AuthUser,
} from '@application/auth/api'
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

type AuthMode = 'login' | 'register' | 'forgot' | 'resetConfirm'

type FeedbackTone = 'success' | 'error'

interface FeedbackState {
  type: FeedbackTone
  message: string
}

interface InitialAuthState {
  mode: AuthMode
  resetToken?: string
  notice: FeedbackState | null
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

function resolveInitialAuthState(): InitialAuthState {
  if (typeof window === 'undefined') {
    return { mode: 'login', notice: null }
  }

  const { pathname, search } = window.location

  if (pathname.startsWith('/password-reset/confirm')) {
    return {
      mode: 'resetConfirm',
      resetToken: readResetToken(search),
      notice: null,
    }
  }

  if (pathname.startsWith('/verify-email')) {
    return {
      mode: 'login',
      notice: {
        type: 'success',
        message: 'Account succesvol aangemaakt. Controleer je e-mail om je account te bevestigen.',
      },
    }
  }

  if (pathname.startsWith('/forgot-password') || pathname.startsWith('/password-reset')) {
    return { mode: 'forgot', notice: null }
  }

  if (pathname.startsWith('/register')) {
    return { mode: 'register', notice: null }
  }

  return { mode: 'login', notice: null }
}

function readResetToken(search: string): string {
  try {
    const params = new URLSearchParams(search)
    return params.get('token')?.trim() ?? ''
  } catch (error) {
    console.warn('Kon reset-token niet lezen', error)
    return ''
  }
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }
  if (!trimmed.includes('@')) {
    return true
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export function Login({ onLogin }: LoginProps) {
  const support = useMemo(() => resolveSupportConfig(), [])
  const helpCenterUrl = support.helpCenterBaseUrl
  const statusPageUrl = support.statusPageUrl
  const initialAuthState = useMemo(() => resolveInitialAuthState(), [])

  const [mode, setMode] = useState<AuthMode>(initialAuthState.mode)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState<FeedbackState | null>(initialAuthState.notice)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [registerErrors, setRegisterErrors] = useState<string[]>([])
  const [isRegistering, setIsRegistering] = useState(false)

  const [resetEmail, setResetEmail] = useState('')
  const [resetFeedback, setResetFeedback] = useState<FeedbackState | null>(null)
  const [isRequestingReset, setIsRequestingReset] = useState(false)

  const [resetToken, setResetToken] = useState(initialAuthState.resetToken ?? '')
  const [resetPassword, setResetPassword] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
  const [resetError, setResetError] = useState('')
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)

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

    const targetId =
      mode === 'register'
        ? 'register-form'
        : mode === 'forgot'
          ? 'reset-request-form'
          : mode === 'resetConfirm'
            ? 'reset-confirm-form'
            : 'login-form'

    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    const focusId =
      mode === 'register'
        ? 'register-email'
        : mode === 'forgot'
          ? 'reset-email'
          : mode === 'resetConfirm'
            ? 'new-password'
            : 'login-email'

    const input = document.getElementById(focusId) as HTMLInputElement | null
    if (input && typeof input.focus === 'function') {
      input.focus({ preventScroll: true })
    }
  }, [mode])

  const handleModeChange = useCallback(
    (nextMode: AuthMode, path?: string) => {
      setMode(nextMode)
      setAuthError('')
      setResetFeedback(null)
      setResetError('')
      setAuthNotice(nextMode === 'login' ? authNotice : null)

      if (nextMode !== 'register') {
        setRegisterErrors([])
      }

      if (nextMode !== 'resetConfirm') {
        setResetPassword('')
        setResetPasswordConfirm('')
      }

      if (typeof window !== 'undefined' && path) {
        window.history.pushState({}, '', path)
      }
    },
    [authNotice],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handlePopState = () => {
      const next = resolveInitialAuthState()
      setMode(next.mode)
      setAuthNotice(next.notice)
      setResetToken(next.resetToken ?? '')
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [view])

  useEffect(() => {
    if (mode === 'resetConfirm' && typeof window !== 'undefined') {
      setResetToken(readResetToken(window.location.search))
    }
  }, [mode])

  const stage = useMemo(
    () => ({
      label: 'Authenticatie & toegang',
      status: 'in-progress' as const,
      detail: authError ? 'Controleer je gegevens en probeer opnieuw.' : 'Gebruik SSO of een demo-account om verder te gaan.',
    }),
    [authError],
  )

  const statusMessage = useMemo(() => {
    if (authError) {
      return {
        tone: 'danger' as const,
        title: 'Login mislukt',
        description: (
          <>
            {authError}
            <br />
            Controleer gebruikersnaam en wachtwoord of kies een ander demoprofiel.
          </>
        ),
      }
    }

    if (authNotice) {
      return {
        tone: authNotice.type === 'success' ? ('success' as const) : ('warning' as const),
        title: authNotice.type === 'success' ? 'Klaar om te starten' : 'Let op',
        description: authNotice.message,
      }
    }

    return {
      tone: 'info' as const,
      title: 'Welkom bij de pilotomgeving',
      description: 'Toegang tot de pilot activeert automatisch explainers, auditlogs en monitoring voor alle persona\'s.',
    }
  }, [authError, authNotice])

  const actions = useMemo(
    () => [
      {
        id: 'scroll-to-form',
        label: 'Ga naar formulier',
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

  const activeEmail = useMemo(() => {
    const trimmed = user.trim()
    if (!trimmed) {
      return 'bart@rentguy.demo'
    }
    return resolveEmail(trimmed)
  }, [user])

  const navigationRail = useMemo(
    () => ({
      title: 'Pilot gebruikersflows',
      caption: 'Doorloop de flows in volgorde om explainers, dashboards en go-live checks automatisch te activeren.',
      items: createFlowNavigation(
        'login',
        { secrets: 'blocked' },
        {
          login: (
            <span>
              Actieve demo: <strong>{activeEmail}</strong>
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
    [activeEmail],
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
    setAuthError('')
    setAuthNotice(null)
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
        setAuthError(deriveLoginErrorMessage(result.error))
      }
    } catch (error) {
      console.error('Onverwachte loginfout', error)
      setAuthError('Login mislukt. Controleer gegevens.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = registerEmail.trim()
    const trimmedPassword = registerPassword.trim()
    const errors: string[] = []

    if (!trimmedEmail) {
      errors.push('E-mail is verplicht')
    } else if (!isValidEmail(trimmedEmail)) {
      errors.push('Ongeldig e-mailadres')
    }

    if (!trimmedPassword) {
      errors.push('Wachtwoord is verplicht')
    } else if (trimmedPassword.length < 8) {
      errors.push('Wachtwoord moet minimaal 8 tekens bevatten')
    }

    if (!acceptTerms) {
      errors.push('Accepteer de voorwaarden om verder te gaan')
    }

    setRegisterErrors(errors)
    if (errors.length > 0) {
      return
    }

    setIsRegistering(true)

    try {
      const result = await registerUser({
        email: trimmedEmail,
        password: trimmedPassword,
        acceptTerms: true,
      })

      if (result.ok) {
        setRegisterEmail('')
        setRegisterPassword('')
        setAcceptTerms(false)
        setRegisterErrors([])
        setAuthNotice({
          type: 'success',
          message: 'Account succesvol aangemaakt. Controleer je e-mail om je account te bevestigen.',
        })
        setMode('login')
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/verify-email')
        }
      } else {
        setRegisterErrors([deriveRegisterErrorMessage(result.error)])
      }
    } catch (error) {
      console.error('Registratie mislukt', error)
      setRegisterErrors(['Account aanmaken is mislukt. Probeer het opnieuw.'])
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResetFeedback(null)

    const trimmedEmail = resetEmail.trim()
    if (!trimmedEmail) {
      setResetFeedback({ type: 'error', message: 'E-mail is verplicht' })
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setResetFeedback({ type: 'error', message: 'Ongeldig e-mailadres' })
      return
    }

    setIsRequestingReset(true)

    try {
      const result = await requestPasswordReset({ email: trimmedEmail })
      if (result.ok) {
        setResetFeedback({ type: 'success', message: 'Reset link verzonden' })
        setResetEmail('')
      } else {
        setResetFeedback({ type: 'error', message: derivePasswordResetErrorMessage(result.error) })
      }
    } catch (error) {
      console.error('Reset-aanvraag mislukt', error)
      setResetFeedback({ type: 'error', message: 'Resetaanvraag mislukt. Probeer het opnieuw.' })
    } finally {
      setIsRequestingReset(false)
    }
  }

  async function handleResetConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResetError('')

    const trimmedPassword = resetPassword.trim()
    const trimmedConfirm = resetPasswordConfirm.trim()

    if (!resetToken) {
      setResetError('Deze resetlink is ongeldig of verlopen.')
      return
    }

    if (!trimmedPassword) {
      setResetError('Wachtwoord is verplicht')
      return
    }

    if (trimmedPassword.length < 8) {
      setResetError('Wachtwoord moet minimaal 8 tekens bevatten')
      return
    }

    if (trimmedPassword !== trimmedConfirm) {
      setResetError('Wachtwoorden komen niet overeen')
      return
    }

    setIsConfirmingReset(true)

    try {
      const result = await confirmPasswordReset({
        token: resetToken,
        password: trimmedPassword,
        confirmPassword: trimmedConfirm,
      })

      if (result.ok) {
        setAuthNotice({ type: 'success', message: 'Wachtwoord succesvol gewijzigd' })
        setMode('login')
        setResetPassword('')
        setResetPasswordConfirm('')
        setResetToken('')
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/login')
        }
      } else {
        setResetError(derivePasswordResetErrorMessage(result.error))
      }
    } catch (error) {
      console.error('Reset bevestigen mislukt', error)
      setResetError('Wachtwoord resetten is mislukt. Probeer het opnieuw.')
    } finally {
      setIsConfirmingReset(false)
    }
  }

  const loginForm = (
    <form id="login-form" style={{ display: 'grid', gap: 18 }} onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Demo login</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Gebruik de demo-accounts om flows te testen. Tokens, onboardingprogressie en audit logs worden automatisch gevuld.
        </p>
      </div>
      <label htmlFor="login-email" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>E-mailadres of gebruikersnaam</span>
        <input
          id="login-email"
          data-testid="email-input"
          value={user}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setUser(event.target.value)
            setAuthError('')
            setAuthNotice(null)
          }}
          placeholder="bijv. bart of bart@rentguy.demo"
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
      <label htmlFor="login-password" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Wachtwoord</span>
        <input
          type="password"
          id="login-password"
          data-testid="password-input"
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setPassword(event.target.value)
            setAuthError('')
            setAuthNotice(null)
          }}
          placeholder="bijv. mr-dj"
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
        <button
          type="button"
          data-testid="register-link"
          onClick={() => handleModeChange('register', '/register')}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: `1px solid ${withOpacity('#FFFFFF', 0.35)}`,
            background: 'transparent',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Account aanmaken
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          data-testid="forgot-password-link"
          onClick={() => handleModeChange('forgot', '/forgot-password')}
          style={{
            background: 'none',
            border: 'none',
            color: withOpacity('#ffffff', 0.82),
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Wachtwoord vergeten?
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setUser('bart')
              setPassword('mr-dj')
              setAuthError('')
            }}
            style={{
              background: withOpacity('#FFFFFF', 0.12),
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Vul Bart in
          </button>
          <button
            type="button"
            onClick={() => {
              setUser('rentguy')
              setPassword('rentguy')
              setAuthError('')
            }}
            style={{
              background: withOpacity('#FFFFFF', 0.12),
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Vul RentGuy in
          </button>
        </div>
      </div>
    </form>
  )

  const registerForm = (
    <form id="register-form" style={{ display: 'grid', gap: 16 }} onSubmit={handleRegister}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Nieuw account aanmaken</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Maak een proefaccount aan om de pilotflows te volgen. We sturen een bevestiging naar je e-mailadres.
        </p>
      </div>
      <label htmlFor="register-email" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>E-mailadres</span>
        <input
          id="register-email"
          data-testid="email-input"
          value={registerEmail}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setRegisterEmail(event.target.value)
            setRegisterErrors([])
          }}
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
      <label htmlFor="register-password" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Wachtwoord</span>
        <input
          type="password"
          id="register-password"
          data-testid="password-input"
          value={registerPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setRegisterPassword(event.target.value)
            setRegisterErrors([])
          }}
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
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          data-testid="terms-checkbox"
          checked={acceptTerms}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setAcceptTerms(event.target.checked)
            setRegisterErrors([])
          }}
          style={{ width: 18, height: 18, marginTop: 4 }}
        />
        <span style={{ color: withOpacity('#ffffff', 0.85), fontSize: '0.85rem' }}>
          Ik ga akkoord met de Sevensa voorwaarden en ontvang updates over de pilot.
        </span>
      </label>
      {registerErrors.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 20, color: brand.colors.warning, fontSize: '0.85rem', display: 'grid', gap: 4 }}>
          {registerErrors.map(error => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          {isRegistering ? 'Registreren…' : 'Account registreren'}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('login', '/login')}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: `1px solid ${withOpacity('#FFFFFF', 0.35)}`,
            background: 'transparent',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Terug naar inloggen
        </button>
      </div>
    </form>
  )

  const resetRequestForm = (
    <form id="reset-request-form" style={{ display: 'grid', gap: 16 }} onSubmit={handleResetRequest}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Wachtwoord vergeten</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          We sturen een e-mail met een resetlink zodat je een nieuw wachtwoord kunt instellen.
        </p>
      </div>
      <label htmlFor="reset-email" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>E-mailadres</span>
        <input
          id="reset-email"
          data-testid="email-input"
          value={resetEmail}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setResetEmail(event.target.value)
            setResetFeedback(null)
          }}
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
      {resetFeedback && (
        <p
          role={resetFeedback.type === 'error' ? 'alert' : 'status'}
          style={{
            margin: 0,
            color: resetFeedback.type === 'success' ? brand.colors.success : brand.colors.warning,
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {resetFeedback.message}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          {isRequestingReset ? 'Verzenden…' : 'Reset link versturen'}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('login', '/login')}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: `1px solid ${withOpacity('#FFFFFF', 0.35)}`,
            background: 'transparent',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Terug naar inloggen
        </button>
      </div>
    </form>
  )

  const resetConfirmForm = (
    <form id="reset-confirm-form" style={{ display: 'grid', gap: 16 }} onSubmit={handleResetConfirm}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Nieuw wachtwoord instellen</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
          Kies een sterk wachtwoord. Na bevestiging sturen we je terug naar het login-scherm.
        </p>
      </div>
      <label htmlFor="new-password" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Nieuw wachtwoord</span>
        <input
          type="password"
          id="new-password"
          data-testid="new-password-input"
          value={resetPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setResetPassword(event.target.value)
            setResetError('')
          }}
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
      <label htmlFor="confirm-password" style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Bevestig wachtwoord</span>
        <input
          type="password"
          id="confirm-password"
          data-testid="confirm-password-input"
          value={resetPasswordConfirm}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setResetPasswordConfirm(event.target.value)
            setResetError('')
          }}
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
        <p role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.9rem', fontWeight: 600 }}>
          {resetError}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          {isConfirmingReset ? 'Opslaan…' : 'Wachtwoord bijwerken'}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('login', '/login')}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: `1px solid ${withOpacity('#FFFFFF', 0.35)}`,
            background: 'transparent',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Annuleren
        </button>
      </div>
    </form>
  )

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

      {mode === 'login' && loginForm}
      {mode === 'register' && registerForm}
      {mode === 'forgot' && resetRequestForm}
      {mode === 'resetConfirm' && resetConfirmForm}

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
  const trimmed = candidate.trim()
  if (!trimmed) {
    return 'info@rentguy.nl'
  }
  if (trimmed.includes('@')) {
    return trimmed
  }
  if (trimmed === 'bart') {
    return 'bart@rentguy.demo'
  }
  if (trimmed === 'rentguy') {
    return 'rentguy@demo.local'
  }
  return `${trimmed}@demo.local`
}

export default Login
