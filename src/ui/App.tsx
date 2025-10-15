import { useCallback, useEffect, useState } from 'react'
import {
  deriveRoleErrorMessage,
  ensureAuthEmail,
  getCurrentUser,
  updateRole,
  type AuthUser,
} from '@application/auth/api'
import { setToken as setApiToken } from '@infra/http/api'
import { brand, brandFontStack } from '@ui/branding'
import Login from './Login'
import OnboardingOverlay from './OnboardingOverlay'
import Planner from './Planner'
import RoleSelection from './RoleSelection'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '@core/storage'

const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 6

function computeShouldShowOnboarding(): boolean {
  const seen = getLocalStorageItem('onb_seen', '0') === '1'
  if (seen) return false
  const snoozeRaw = getLocalStorageItem('onb_snooze_until', '')
  const snoozeUntil = Number.parseInt(snoozeRaw, 10)
  if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) {
    return false
  }
  return true
}

export function App() {
  const [token, setToken] = useState(() => getLocalStorageItem('token', ''))
  const [userEmail, setUserEmail] = useState(() => ensureAuthEmail(getLocalStorageItem('user_email', '')))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(() => computeShouldShowOnboarding())
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [roleError, setRoleError] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let ignore = false

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null

    ;(async () => {
      const result = await getCurrentUser(controller ? { signal: controller.signal } : {})
      if (ignore || controller?.signal.aborted) {
        return
      }

      if (result.ok) {
        const nextUser = result.value
        setUser(nextUser)
        const nextEmail = ensureAuthEmail(nextUser.email)
        setUserEmail(nextEmail)
        setLocalStorageItem('user_role', nextUser.role ?? '')
      } else {
        if (result.error.code !== 'cancelled') {
          console.warn('Kon gebruikersgegevens niet laden', result.error)
        }
        const storedEmail = ensureAuthEmail(getLocalStorageItem('user_email', ''))
        setUserEmail(storedEmail)
        setUser(null)
      }
    })()

    return () => {
      ignore = true
      controller?.abort()
    }
  }, [token])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const linkId = 'sevensa-rentguy-fonts'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap'
      document.head.appendChild(link)
    }

    const previousStyles = {
      background: document.body.style.background,
      color: document.body.style.color,
      fontFamily: document.body.style.fontFamily,
      margin: document.body.style.margin,
    }

    document.body.style.background = brand.colors.appBackground
    document.body.style.color = brand.colors.text
    document.body.style.fontFamily = brandFontStack
    document.body.style.margin = '0'

    return () => {
      document.body.style.background = previousStyles.background
      document.body.style.color = previousStyles.color
      document.body.style.fontFamily = previousStyles.fontFamily
      document.body.style.margin = previousStyles.margin
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brand.shortName} × ${brand.tenant.name}`
    }
  }, [])

  const handleLogin = useCallback((nextToken: string, email?: string) => {
    const normalisedEmail = ensureAuthEmail(email)
    setLocalStorageItem('token', nextToken)
    setLocalStorageItem('user_email', normalisedEmail)
    removeLocalStorageItem('user_role')
    setApiToken(nextToken)
    setToken(nextToken)
    setUserEmail(normalisedEmail)
    setUser(null)
    setShowOnboarding(computeShouldShowOnboarding())
  }, [])

  useEffect(() => {
    if (token) {
      setShowOnboarding(computeShouldShowOnboarding())
    } else {
      setShowOnboarding(false)
      setUser(null)
      setIsRoleModalOpen(false)
      setRoleError('')
    }
  }, [token])

  useEffect(() => {
    if (user?.role === 'pending' && token) {
      setIsRoleModalOpen(true)
    } else {
      setIsRoleModalOpen(false)
    }
  }, [user, token])

  const handleLogout = useCallback(() => {
    removeLocalStorageItem('token')
    removeLocalStorageItem('user_email')
    removeLocalStorageItem('user_role')
    clearOnboardingState()
    setApiToken('')
    setToken('')
    setUserEmail('')
    setUser(null)
    setShowOnboarding(false)
    setIsRoleModalOpen(false)
    setRoleError('')
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [])

  const handleSnoozeOnboarding = useCallback(() => {
    const snoozeUntil = Date.now() + SNOOZE_DURATION_MS
    setLocalStorageItem('onb_snooze_until', String(snoozeUntil))
    setShowOnboarding(false)
  }, [])

  const handleFinishOnboarding = useCallback(() => {
    setLocalStorageItem('onb_seen', '1')
    removeLocalStorageItem('onb_snooze_until')
    setShowOnboarding(false)
  }, [])

  const handleRoleConfirm = useCallback(
    async (role: string) => {
      if (!role) return
      setRoleError('')
      setIsSavingRole(true)
      try {
        const result = await updateRole({ role })
        if (result.ok) {
          const nextUser = result.value
          setUser(nextUser)
          const nextEmail = ensureAuthEmail(nextUser.email ?? userEmail)
          setUserEmail(nextEmail)
          setLocalStorageItem('user_role', nextUser.role ?? '')
          setIsRoleModalOpen(false)
        } else {
          setRoleError(deriveRoleErrorMessage(result.error))
        }
      } catch (error) {
        console.error('Onverwachte fout bij het opslaan van de rol', error)
        setRoleError('Opslaan van rol is mislukt. Probeer het opnieuw.')
      } finally {
        setIsSavingRole(false)
      }
    },
    [userEmail]
  )

  const resolvedUserRole = user?.role ?? getLocalStorageItem('user_role', '')

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <Planner onLogout={handleLogout} />
      {isRoleModalOpen && (
        <RoleSelection
          email={userEmail}
          onConfirm={handleRoleConfirm}
          onLogout={handleLogout}
          isSubmitting={isSavingRole}
          errorMessage={roleError}
        />
      )}
      {!isRoleModalOpen && showOnboarding && userEmail && (
        <OnboardingOverlay
          email={userEmail}
          role={resolvedUserRole}
          onSnooze={handleSnoozeOnboarding}
          onFinish={handleFinishOnboarding}
        />
      )}
    </>
  )
}

export default App
