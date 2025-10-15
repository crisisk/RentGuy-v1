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
import OnboardingOverlay from './OnboardingOverlay'
import RoleSelection from './RoleSelection'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '@core/storage'
import { subscribeToTokenChanges } from '@core/auth-token-storage'
import { useAuthStore } from '@stores/authStore'
import AppRouter from '@router/index'

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
  const token = useAuthStore(state => state.token)
  const user = useAuthStore(state => state.user)
  const setAuthCredentials = useAuthStore(state => state.setCredentials)
  const clearAuth = useAuthStore(state => state.clear)
  const markAuthChecking = useAuthStore(state => state.markChecking)
  const markAuthError = useAuthStore(state => state.markError)
  const syncAuthToken = useAuthStore(state => state.syncToken)
  const [userEmail, setUserEmail] = useState(() => ensureAuthEmail(getLocalStorageItem('user_email', '')))
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

    markAuthChecking()

    ;(async () => {
      const result = await getCurrentUser(controller ? { signal: controller.signal } : {})
      if (ignore || controller?.signal.aborted) {
        return
      }

      if (result.ok) {
        const nextUser = result.value
        const ensuredEmail = ensureAuthEmail(nextUser.email ?? userEmail)
        const normalizedUser: AuthUser = {
          ...nextUser,
          email: ensuredEmail,
        }
        setAuthCredentials(token, normalizedUser)
        setUserEmail(ensuredEmail)
        setLocalStorageItem('user_role', normalizedUser.role ?? '')
      } else {
        if (result.error.code !== 'cancelled') {
          console.warn('Kon gebruikersgegevens niet laden', result.error)
        }
        const storedEmail = ensureAuthEmail(getLocalStorageItem('user_email', ''))
        setUserEmail(storedEmail)
        markAuthError(result.error.message ?? 'Authenticatiecontrole mislukt')
      }
    })()

    return () => {
      ignore = true
      controller?.abort()
    }
  }, [markAuthChecking, markAuthError, setAuthCredentials, token, userEmail])

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

  useEffect(() => {
    const unsubscribe = subscribeToTokenChanges(nextToken => {
      const trimmed = nextToken.trim()
      if (trimmed) {
        syncAuthToken(trimmed)
        const storedEmail = ensureAuthEmail(getLocalStorageItem('user_email', ''))
        setUserEmail(storedEmail)
        setShowOnboarding(computeShouldShowOnboarding())
      } else {
        clearAuth()
        setUserEmail('')
        setShowOnboarding(false)
        setIsRoleModalOpen(false)
        setRoleError('')
      }
    })
    return unsubscribe
  }, [clearAuth, syncAuthToken])

  const handleLogin = useCallback(
    (nextToken: string, authenticatedUser: AuthUser) => {
      const normalisedEmail = ensureAuthEmail(authenticatedUser.email)
      setLocalStorageItem('user_email', normalisedEmail)
      removeLocalStorageItem('user_role')
      setApiToken(nextToken)
      const normalizedUser: AuthUser = {
        ...authenticatedUser,
        email: normalisedEmail,
      }
      setAuthCredentials(nextToken, normalizedUser)
      setUserEmail(normalisedEmail)
      setShowOnboarding(computeShouldShowOnboarding())
      setIsRoleModalOpen(false)
      setRoleError('')
    },
    [setAuthCredentials],
  )

  useEffect(() => {
    if (token) {
      setShowOnboarding(computeShouldShowOnboarding())
    } else {
      setShowOnboarding(false)
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
    removeLocalStorageItem('user_email')
    removeLocalStorageItem('user_role')
    clearOnboardingState()
    setApiToken('')
    clearAuth()
    setUserEmail('')
    setShowOnboarding(false)
    setIsRoleModalOpen(false)
    setRoleError('')
  }, [clearAuth])

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
          const ensuredEmail = ensureAuthEmail(nextUser.email ?? userEmail)
          const normalizedUser: AuthUser = {
            ...nextUser,
            email: ensuredEmail,
          }
          if (token) {
            setAuthCredentials(token, normalizedUser)
          }
          setUserEmail(ensuredEmail)
          setLocalStorageItem('user_role', normalizedUser.role ?? '')
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
    [setAuthCredentials, token, userEmail]
  )

  const resolvedUserRole = user?.role ?? getLocalStorageItem('user_role', '')

  return (
    <>
      <AppRouter isAuthenticated={Boolean(token)} onLogin={handleLogin} onLogout={handleLogout} />
      {isRoleModalOpen && (
        <RoleSelection
          email={userEmail}
          onConfirm={handleRoleConfirm}
          onLogout={handleLogout}
          isSubmitting={isSavingRole}
          errorMessage={roleError}
        />
      )}
      {!isRoleModalOpen && showOnboarding && userEmail && token && (
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
