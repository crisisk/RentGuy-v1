import { useCallback, useEffect, useState } from 'react'
import Login from './Login'
import OnboardingOverlay from './OnboardingOverlay.jsx'
import Planner from './Planner.jsx'
import RoleSelection from './RoleSelection'
import { api } from './api'
import { brand, brandFontStack } from './branding'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './storage'

const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 6

interface AuthUser {
  email?: string
  role?: string
}

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

function ensureEmail(candidate?: string) {
  return candidate && candidate.trim() ? candidate : 'bart@rentguy.demo'
}

export function App() {
  const [token, setToken] = useState(() => getLocalStorageItem('token', ''))
  const [userEmail, setUserEmail] = useState(() => ensureEmail(getLocalStorageItem('user_email', '')))
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

    ;(async () => {
      try {
        const response = await api.get<AuthUser>('/api/v1/auth/me')
        if (ignore) return
        setUser(response.data)
        setUserEmail(ensureEmail(response.data.email))
        setLocalStorageItem('user_role', response.data.role ?? '')
      } catch (error) {
        console.warn('Kon gebruikersgegevens niet laden', error)
        if (ignore) return
        const storedEmail = ensureEmail(getLocalStorageItem('user_email', ''))
        setUserEmail(storedEmail)
        setUser(null)
      }
    })()

    return () => {
      ignore = true
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
    const normalisedEmail = ensureEmail(email)
    setLocalStorageItem('token', nextToken)
    setLocalStorageItem('user_email', normalisedEmail)
    removeLocalStorageItem('user_role')
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
        const { data } = await api.post<AuthUser>('/api/v1/auth/role', { role })
        setUser(data)
        setUserEmail(ensureEmail(data.email ?? userEmail))
        setLocalStorageItem('user_role', data.role ?? '')
        setIsRoleModalOpen(false)
      } catch (error: any) {
        const detail = error?.response?.data?.detail
        setRoleError(typeof detail === 'string' ? detail : 'Opslaan van rol is mislukt. Probeer het opnieuw.')
      } finally {
        setIsSavingRole(false)
      }
    },
    [userEmail]
  )

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
        <OnboardingOverlay email={userEmail} onSnooze={handleSnoozeOnboarding} onFinish={handleFinishOnboarding} />
      )}
    </>
  )
}

export default App
