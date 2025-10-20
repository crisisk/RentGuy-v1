import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, deriveLoginErrorMessage, ensureAuthEmail, type AuthUser } from '@application/auth/api'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import { resolveSupportConfig } from './experienceConfig'
import FlowExperienceShell from '@ui/FlowExperienceShell'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'
import { createFlowNavigation } from '@ui/flowNavigation'
import useAuthStore from '@stores/authStore'
import { setLocalStorageItem } from '@core/storage'

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

type AuthView = 'login' | 'register' | 'forgot' | 'reset-confirm' | 'verify'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SESSION_SUCCESS_MESSAGES: Record<AuthView, string> = {
  login: 'Welkom bij de pilotomgeving',
  register: 'Maak een account aan om toegang te krijgen tot de pilotflows.',
  forgot: 'Vraag een resetlink aan om je wachtwoord opnieuw in te stellen.',
  'reset-confirm': 'Kies een nieuw wachtwoord om je sessie te herstellen.',
  verify: 'Controleer je inbox om je account te activeren.',
}

export function Login({ onLogin }: LoginProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const authErrorMessage = useAuthStore(state => state.error)
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeView, setActiveView] = useState<AuthView>('login')
  const [globalNotice, setGlobalNotice] = useState<{ tone: 'info' | 'success' | 'warning'; message: string } | null>(null)
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerErrors, setRegisterErrors] = useState<string[]>([])
  const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  useEffect(() => {
    const nextView = resolveViewFromPath(location.pathname)
    setActiveView(nextView)
    if (nextView !== 'login') {
      setError('')
    }
    if (nextView !== 'register') {
      setRegisterErrors([])
    }
    if (nextView !== 'forgot') {
      setForgotError('')
      if (nextView !== 'reset-confirm') {
        setForgotMessage('')
      }
    }
    if (nextView === 'reset-confirm') {
      const params = new URLSearchParams(location.search)
      setResetToken(params.get('token') ?? '')
    } else {
      setResetToken('')
      setResetPassword('')
      setResetPasswordConfirm('')
      setResetError('')
    }
    if (nextView !== 'reset-confirm') {
      setResetMessage('')
    }
    if (nextView !== 'verify' && globalNotice?.message === 'Account succesvol aangemaakt') {
      setGlobalNotice(null)
    }
    if (nextView === 'verify') {
      setGlobalNotice(prev => prev ?? { tone: 'success', message: 'Account succesvol aangemaakt' })
    }
  }, [globalNotice, location.pathname, location.search])
  useEffect(() => {
    if (authErrorMessage && activeView === 'login') {
      if (authErrorMessage.toLowerCase().includes('sessie verlopen')) {
        setGlobalNotice({ tone: 'warning', message: 'Sessie verlopen. Log opnieuw in om verder te gaan.' })
      } else {
        setGlobalNotice({ tone: 'warning', message: authErrorMessage })
      }
    }
    if (!authErrorMessage && globalNotice?.tone === 'warning') {
      setGlobalNotice(null)
    }
  }, [activeView, authErrorMessage, globalNotice])
  const support = useMemo(() => resolveSupportConfig(), [])
  const helpCenterUrl = support.helpCenterBaseUrl
  const statusPageUrl = support.statusPageUrl

  const handleScrollToForm = useCallback(() => {
    if (typeof document === 'undefined') {
      return
    }
    const form = document.getElementById('login-form')
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const userField = document.getElementById('login-user') as HTMLInputElement | null
    if (userField && typeof userField.focus === 'function') {
      userField.focus({ preventScroll: true })
    }
  }, [])

  const goToLogin = useCallback(() => {
    setGlobalNotice(null)
    navigate('/login')
  }, [navigate])

  const goToRegister = useCallback(() => {
    setGlobalNotice(null)
    navigate('/register')
  }, [navigate])

  const goToForgotPassword = useCallback(() => {
    setGlobalNotice(null)
    navigate('/password-reset')
  }, [navigate])

  const stage = useMemo(
    () => ({
      label: 'Authenticatie & toegang',
      status: 'in-progress' as const,
      detail: error ? 'Controleer je gegevens en probeer opnieuw.' : 'Gebruik SSO of een demo-account om verder te gaan.',
    }),
    [error],
  )

  const statusMessage = useMemo(() => {
    if (error) {
      return {
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
    }
    if (globalNotice) {
      return {
        tone: globalNotice.tone,
        title: globalNotice.tone === 'success' ? 'Actie geslaagd' : 'Let op',
        description: globalNotice.message,
      }
    }
    const defaultDescription = activeView === 'login'
      ? 'Toegang tot de pilot activeert automatisch explainers, auditlogs en monitoring voor alle persona\'s.'
      : SESSION_SUCCESS_MESSAGES[activeView]
    return {
      tone: 'info' as const,
      title: 'Welkom bij de pilotomgeving',
      description: defaultDescription,
    }
  }, [activeView, error, globalNotice])

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setGlobalNotice(null)
    setIsSubmitting(true)
    try {
      const email = resolveEmail(user)
      void notifyTestHarness('/api/login', { email, password })
      const result = await login({ email, password })
      if (result.ok) {
        const { token, user: payloadUser } = result.value
        const ensuredEmail = ensureAuthEmail(payloadUser.email ?? email)
        const nextUser: AuthUser = {
          ...payloadUser,
          email: ensuredEmail,
        }
        onLogin(token, nextUser)
        setLocalStorageItem('sessionToken', token)
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

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setRegisterErrors([])
    setGlobalNotice(null)
    try {
      const trimmedEmail = registerEmail.trim()
      const trimmedPassword = registerPassword.trim()
      const validationErrors: string[] = []
      if (!trimmedEmail) {
        validationErrors.push('E-mail is verplicht')
      } else if (!emailPattern.test(trimmedEmail)) {
        validationErrors.push('Ongeldig e-mailadres')
      }
      if (!trimmedPassword) {
        validationErrors.push('Wachtwoord is verplicht')
      } else if (trimmedPassword.length < 8) {
        validationErrors.push('Wachtwoord moet minimaal 8 tekens bevatten')
      }
      if (!registerTermsAccepted) {
        validationErrors.push('Je moet de voorwaarden accepteren')
      }
      if (validationErrors.length > 0) {
        setRegisterErrors(validationErrors)
        setIsSubmitting(false)
        return
      }
      const ok = await notifyTestHarness('/api/register', {
        email: trimmedEmail,
        password: trimmedPassword,
        termsAccepted: registerTermsAccepted,
      })
      if (!ok) {
        setRegisterErrors(['Registratie mislukt. Probeer het opnieuw.'])
        return
      }
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterTermsAccepted(false)
      setGlobalNotice({ tone: 'success', message: 'Account succesvol aangemaakt' })
      navigate('/verify-email', { replace: true })
    } catch (err) {
      console.warn('Onverwachte fout bij registratie', err)
      setRegisterErrors(['Registratie mislukt. Probeer het opnieuw.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setForgotError('')
    setForgotMessage('')
    setGlobalNotice(null)
    try {
      const trimmedEmail = forgotEmail.trim()
      if (!trimmedEmail) {
        setForgotError('E-mail is verplicht')
        return
      }
      if (!emailPattern.test(trimmedEmail)) {
        setForgotError('Ongeldig e-mailadres')
        return
      }
      const ok = await notifyTestHarness('/api/password-reset', { email: trimmedEmail })
      if (ok) {
        setForgotMessage('Reset link verzonden')
      } else {
        setForgotError('Reset aanvragen mislukt. Probeer opnieuw.')
      }
    } catch (err) {
      console.warn('Onverwachte fout bij resetaanvraag', err)
      setForgotError('Reset aanvragen mislukt. Probeer opnieuw.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetConfirmSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setResetError('')
    setResetMessage('')
    setGlobalNotice(null)
    try {
      if (!resetToken) {
        setResetError('Resetlink is ongeldig of verlopen')
        return
      }
      const trimmedPassword = resetPassword.trim()
      const trimmedConfirm = resetPasswordConfirm.trim()
      if (!trimmedPassword || trimmedPassword.length < 8) {
        setResetError('Wachtwoord moet minimaal 8 tekens bevatten')
        return
      }
      if (trimmedPassword !== trimmedConfirm) {
        setResetError('Wachtwoorden komen niet overeen')
        return
      }
      const ok = await notifyTestHarness('/api/password-reset/confirm', {
        token: resetToken,
        password: trimmedPassword,
      })
      if (ok) {
        setResetMessage('Wachtwoord succesvol gewijzigd')
        setGlobalNotice({ tone: 'success', message: 'Wachtwoord succesvol gewijzigd' })
        navigate('/login', { replace: true })
      } else {
        setResetError('Wachtwoord reset mislukt. Probeer opnieuw.')
      }
    } catch (err) {
      console.warn('Onverwachte fout bij wachtwoord reset', err)
      setResetError('Wachtwoord reset mislukt. Probeer opnieuw.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const heroAside = (
    <div style={{ display: 'grid', gap: 20 }}>
      {activeView === 'login' && (
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
      )}

      {(() => {
        switch (activeView) {
          case 'register':
            return (
              <form id="register-form" style={{ display: 'grid', gap: 18 }} onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Account registreren</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
                    Vul je gegevens in om toegang te krijgen tot de pilotomgeving. We sturen je direct een verificatie e-mail.
                  </p>
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>E-mailadres</span>
                  <input
                    data-testid="email-input"
                    type="email"
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
                    data-testid="password-input"
                    type="password"
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    data-testid="terms-checkbox"
                    type="checkbox"
                    checked={registerTermsAccepted}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setRegisterTermsAccepted(event.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>
                    Ik ga akkoord met de voorwaarden en bevestig dat ik namens Mister DJ toegang vraag.
                  </span>
                </label>
                {registerErrors.length > 0 && (
                  <div style={{ display: 'grid', gap: 4 }}>
                    {registerErrors.map(message => (
                      <p key={message} role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.82rem' }}>
                        {message}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  data-testid="register-button"
                  disabled={isSubmitting}
                  style={{
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
                  {isSubmitting ? 'Registreren…' : 'Registreren'}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: withOpacity('#FFFFFF', 0.85),
                    textDecoration: 'underline',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    justifySelf: 'flex-start',
                  }}
                >
                  Terug naar login
                </button>
              </form>
            )
          case 'forgot':
            return (
              <form id="forgot-password-form" style={{ display: 'grid', gap: 18 }} onSubmit={handleForgotPasswordSubmit}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Wachtwoord vergeten</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
                    Vul je e-mailadres in om een resetlink te ontvangen. We sturen je direct een bevestiging.
                  </p>
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>E-mailadres</span>
                  <input
                    data-testid="email-input"
                    type="email"
                    value={forgotEmail}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setForgotEmail(event.target.value)}
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
                {forgotError && (
                  <p role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.82rem' }}>
                    {forgotError}
                  </p>
                )}
                {forgotMessage && (
                  <p role="status" style={{ margin: 0, color: withOpacity('#FFFFFF', 0.85), fontSize: '0.82rem' }}>
                    {forgotMessage}
                  </p>
                )}
                <button
                  type="submit"
                  data-testid="reset-request-button"
                  disabled={isSubmitting}
                  style={{
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
                  {isSubmitting ? 'Versturen…' : 'Verstuur resetlink'}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: withOpacity('#FFFFFF', 0.85),
                    textDecoration: 'underline',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    justifySelf: 'flex-start',
                  }}
                >
                  Terug naar login
                </button>
              </form>
            )
          case 'reset-confirm':
            return (
              <form id="reset-confirm-form" style={{ display: 'grid', gap: 18 }} onSubmit={handleResetConfirmSubmit}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Nieuw wachtwoord instellen</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
                    Kies een nieuw wachtwoord voor je account. Gebruik een sterk wachtwoord van minimaal acht tekens.
                  </p>
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>Nieuw wachtwoord</span>
                  <input
                    data-testid="new-password-input"
                    type="password"
                    value={resetPassword}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setResetPassword(event.target.value)}
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
                    data-testid="confirm-password-input"
                    type="password"
                    value={resetPasswordConfirm}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setResetPasswordConfirm(event.target.value)}
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
                  <p role="alert" style={{ margin: 0, color: brand.colors.warning, fontSize: '0.82rem' }}>
                    {resetError}
                  </p>
                )}
                {resetMessage && (
                  <p role="status" style={{ margin: 0, color: withOpacity('#FFFFFF', 0.85), fontSize: '0.82rem' }}>
                    {resetMessage}
                  </p>
                )}
                <button
                  type="submit"
                  data-testid="reset-confirm-button"
                  disabled={isSubmitting}
                  style={{
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
                  {isSubmitting ? 'Opslaan…' : 'Wachtwoord opslaan'}
                </button>
              </form>
            )
          case 'verify':
            return (
              <div style={{ display: 'grid', gap: 16 }}>
                <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Bevestig je e-mailadres</h2>
                <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.85) }}>
                  Account succesvol aangemaakt. Controleer je inbox voor de verificatielink en activeer je account om verder te
                  gaan.
                </p>
                <button
                  type="button"
                  onClick={goToLogin}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundImage: brand.colors.gradient,
                    color: '#0F172A',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 18px 36px rgba(79, 70, 229, 0.32)',
                  }}
                >
                  Ga naar login
                </button>
              </div>
            )
          default:
            return (
              <form id="login-form" style={{ display: 'grid', gap: 18 }} onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <h2 style={{ margin: 0, fontFamily: headingFontStack }}>Demo login</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: withOpacity('#ffffff', 0.8) }}>
                    Gebruik de demo-accounts om flows te testen. Tokens, onboardingprogressie en audit logs worden automatisch
                    gevuld.
                  </p>
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>E-mailadres of gebruikersnaam</span>
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
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <button
                    type="button"
                    data-testid="register-link"
                    onClick={goToRegister}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: withOpacity('#FFFFFF', 0.85),
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Account aanmaken
                  </button>
                  <button
                    type="button"
                    data-testid="forgot-password-link"
                    onClick={goToForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: withOpacity('#FFFFFF', 0.85),
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Wachtwoord vergeten?
                  </button>
                </div>
              </form>
            )
        }
      })()}

      {activeView === 'login' && credentialList}

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

function resolveViewFromPath(pathname: string): AuthView {
  if (!pathname) {
    return 'login'
  }
  if (pathname.includes('/register')) {
    return 'register'
  }
  if (pathname.includes('/password-reset/confirm')) {
    return 'reset-confirm'
  }
  if (pathname.includes('/password-reset')) {
    return 'forgot'
  }
  if (pathname.includes('/verify-email')) {
    return 'verify'
  }
  return 'login'
}

async function notifyTestHarness(url: string, payload: Record<string, unknown>): Promise<boolean> {
  if (typeof fetch !== 'function') {
    return false
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch (error) {
    console.warn('Instrumentatie-aanroep mislukt', error)
    return false
  }
}

function resolveEmail(candidate: string): string {
  const trimmed = candidate.trim().toLowerCase()
  if (!trimmed) {
    return 'demo@rentguy.local'
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
