import { useCallback, useEffect, useState } from 'react'
import {
  deriveRoleErrorMessage,
  ensureAuthEmail,
  getCurrentUser,
  isOfflineDemoToken,
  updateRole,
  type AuthUser,
} from '@application/auth/api'
import { setToken as setApiToken } from '@infra/http/api'
import { brand, brandFontStack } from '@ui/branding'
import { useBrandingChrome, useDocumentTitle, useOnboardingPreferences } from '@hooks'
import OnboardingOverlay from './OnboardingOverlay'
import RoleSelection from './RoleSelection'
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '@core/storage'
import { subscribeToTokenChanges } from '@core/auth-token-storage'
import { useAuthStore, signalManualLogout } from '@stores/authStore'
import AppRouter from '@router/index'
import MarketingLandingPage from './MarketingLandingPage'
import MarketingDemoPage from './MarketingDemoPage'
import {
  resolveExperienceConfig,
  describeTenantDisplayName,
  type MarketingExperienceConfig,
  type TenantExperienceConfig,
} from './experienceConfig'

const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 6
const BRAND_FONT_LINK_ID = 'sevensa-rentguy-fonts'
const BRAND_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap'
const BRANDING_CHROME_OPTIONS = {
  background: brand.colors.appBackground,
  textColor: brand.colors.text,
  fontFamily: brandFontStack,
  fontHref: BRAND_FONT_HREF,
  fontLinkId: BRAND_FONT_LINK_ID,
} as const

interface TenantPortalAppProps {
  readonly experience: TenantExperienceConfig
}

function normaliseMarketingPath(path: string): string {
  if (!path) {
    return '/'
  }
  const trimmed = path.trim()
  const [rawPath, rawHash] = trimmed.split('#', 2)
  const ensuredPath = rawPath ? (rawPath.startsWith('/') ? rawPath : `/${rawPath}`) : '/'
  const cleanedPath = ensuredPath === '/'
    ? '/'
    : ensuredPath
        .replace(/\/{2,}/g, '/')
        .replace(/\/+$/, '') || '/'
  return rawHash ? `${cleanedPath}#${rawHash}` : cleanedPath
}

function resolveInitialMarketingPath(fallbackPath: string): string {
  if (typeof window === 'undefined') {
    return normaliseMarketingPath(fallbackPath)
  }
  const { pathname, hash } = window.location
  const combined = `${pathname || '/'}${hash || ''}`
  return normaliseMarketingPath(combined || fallbackPath)
}

function useMarketingNavigation(fallbackPath: string) {
  const [path, setPath] = useState<string>(() => resolveInitialMarketingPath(fallbackPath))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handler = () => {
      setPath(resolveInitialMarketingPath(fallbackPath))
    }
    window.addEventListener('popstate', handler)
    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [fallbackPath])

  const navigate = useCallback((target: string, options: { replace?: boolean } = {}) => {
    const next = normaliseMarketingPath(target || fallbackPath)
    if (typeof window !== 'undefined') {
      if (options.replace) {
        window.history.replaceState({}, '', next)
      } else {
        window.history.pushState({}, '', next)
      }
    }
    setPath(next)
  }, [fallbackPath])

  return { path, navigate }
}

function TenantPortalApp({ experience }: TenantPortalAppProps) {
  const token = useAuthStore(state => state.token)
  const user = useAuthStore(state => state.user)
  const setAuthCredentials = useAuthStore(state => state.setCredentials)
  const clearAuth = useAuthStore(state => state.clear)
  const markAuthChecking = useAuthStore(state => state.markChecking)
  const markAuthError = useAuthStore(state => state.markError)
  const markAuthOffline = useAuthStore(state => state.markOffline)
  const syncAuthToken = useAuthStore(state => state.syncToken)
  const {
    shouldShow,
    refresh: refreshOnboarding,
    snooze: snoozeOnboarding,
    markSeen: markOnboardingSeen,
    reset: resetOnboarding,
  } = useOnboardingPreferences(SNOOZE_DURATION_MS)
  const tenantDisplayName = describeTenantDisplayName(experience)
  useBrandingChrome(BRANDING_CHROME_OPTIONS)
  useDocumentTitle(`${brand.shortName} · ${tenantDisplayName}`)
  const [userEmail, setUserEmail] = useState(() => ensureAuthEmail(getLocalStorageItem('user_email', '')))
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [roleError, setRoleError] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    if (isOfflineDemoToken(token)) {
      const storedEmail = ensureAuthEmail(getLocalStorageItem('user_email', ''))
      setUserEmail(storedEmail)
      markAuthOffline('Offline demo-modus geactiveerd. Lokale data wordt gebruikt.')
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
        if (result.error.code === 'network' || result.error.code === 'timeout') {
          markAuthOffline('Geen netwerkverbinding. We tonen de laatst bekende demo-data.')
        } else {
          markAuthError(result.error.message ?? 'Authenticatiecontrole mislukt')
        }
      }
    })()

    return () => {
      ignore = true
      controller?.abort()
    }
  }, [markAuthChecking, markAuthError, markAuthOffline, setAuthCredentials, token, userEmail])

  useEffect(() => {
    const unsubscribe = subscribeToTokenChanges(nextToken => {
      const trimmed = nextToken.trim()
      if (trimmed) {
        syncAuthToken(trimmed)
        const storedEmail = ensureAuthEmail(getLocalStorageItem('user_email', ''))
        setUserEmail(storedEmail)
        refreshOnboarding()
      } else {
        clearAuth()
        setUserEmail('')
        setIsRoleModalOpen(false)
        setRoleError('')
        refreshOnboarding()
      }
    })
    return unsubscribe
  }, [clearAuth, refreshOnboarding, syncAuthToken])

  const handleLogin = useCallback(
    (nextToken: string, authenticatedUser: AuthUser) => {
      const normalisedEmail = ensureAuthEmail(authenticatedUser.email)
      setLocalStorageItem('user_email', normalisedEmail)
      removeLocalStorageItem('user_role')
      setApiToken(nextToken)
      setLocalStorageItem('sessionToken', nextToken)
      const normalizedUser: AuthUser = {
        ...authenticatedUser,
        email: normalisedEmail,
      }
      setAuthCredentials(nextToken, normalizedUser)
      setUserEmail(normalisedEmail)
      refreshOnboarding()
      setIsRoleModalOpen(false)
      setRoleError('')
    },
    [refreshOnboarding, setAuthCredentials],
  )

  useEffect(() => {
    if (token) {
      refreshOnboarding()
    } else {
      setIsRoleModalOpen(false)
      setRoleError('')
    }
  }, [refreshOnboarding, token])

  useEffect(() => {
    if (user?.role === 'pending' && token) {
      setIsRoleModalOpen(true)
    } else {
      setIsRoleModalOpen(false)
    }
  }, [user, token])

  const handleLogout = useCallback(() => {
    signalManualLogout()
    removeLocalStorageItem('user_email')
    removeLocalStorageItem('user_role')
    removeLocalStorageItem('sessionToken')
    setApiToken('')
    clearAuth()
    setUserEmail('')
    resetOnboarding()
    setIsRoleModalOpen(false)
    setRoleError('')
  }, [clearAuth, resetOnboarding])

  const handleSnoozeOnboarding = useCallback(() => {
    snoozeOnboarding(SNOOZE_DURATION_MS)
  }, [snoozeOnboarding])

  const handleFinishOnboarding = useCallback(() => {
    markOnboardingSeen()
  }, [markOnboardingSeen])

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
      <AppRouter
        isAuthenticated={Boolean(token)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        basename={experience.routerBasePath}
        postLoginPath={experience.postLoginPath}
        defaultAuthenticatedPath={experience.defaultAuthenticatedPath}
        defaultUnauthenticatedPath={experience.defaultUnauthenticatedPath}
        secretsFocusPath={experience.secretsFocusPath}
      />
      {isRoleModalOpen && (
        <RoleSelection
          email={userEmail}
          onConfirm={handleRoleConfirm}
          onLogout={handleLogout}
          isSubmitting={isSavingRole}
          errorMessage={roleError}
        />
      )}
      {!isRoleModalOpen && shouldShow && userEmail && token && (
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

function MarketingExperienceApp({ config }: { readonly config: MarketingExperienceConfig }) {
  useBrandingChrome(BRANDING_CHROME_OPTIONS)
  const { path, navigate } = useMarketingNavigation(config.demoPagePath)
  const isDemoRoute = path.startsWith(config.demoPagePath)
  useDocumentTitle(
    isDemoRoute ? 'RentGuy · Demo-ervaring voor prospects' : 'RentGuy · Alles-in-één verhuurplatform',
  )

  if (isDemoRoute) {
    return <MarketingDemoPage config={config} onNavigate={navigate} currentPath={path} />
  }

  return <MarketingLandingPage config={config} onNavigate={navigate} currentPath={path} />
}

export function App(): JSX.Element {
  const experience = resolveExperienceConfig()
  if (experience.mode === 'marketing') {
    return <MarketingExperienceApp config={experience} />
  }

  return <TenantPortalApp experience={experience} />
}

export default App
