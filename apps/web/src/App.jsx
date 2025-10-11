import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Login from './Login.jsx'
import Planner from './Planner.jsx'
import OnboardingOverlay from './OnboardingOverlay.jsx'
import { api, setToken as applyToken } from './api.js'
import { applyBrandSurface, brand } from './theme.js'
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './storage.js'

const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 6

function computeShouldShowOnboarding(currentToken) {
  if (!currentToken) return false
  const seen = getLocalStorageItem('onb_seen', '0') === '1'
  if (seen) return false
  const snoozeRaw = getLocalStorageItem('onb_snooze_until', '')
  const snoozeUntil = Number.parseInt(snoozeRaw, 10)
  if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) {
    return false
  }
  return true
}

function getStoredEmail() {
  return getLocalStorageItem('user_email', '') || 'bart@rentguy.demo'
}

export default function App() {
  const [token, setToken] = useState(() => getLocalStorageItem('token', ''))
  const [userEmail, setUserEmail] = useState(() => getStoredEmail())
  const [showOnboarding, setShowOnboarding] = useState(() => computeShouldShowOnboarding(token))

  useEffect(() => {
    const cleanup = applyBrandSurface()
    return cleanup
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const linkId = 'sevensa-mrdj-fonts'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Poppins:wght@400;500;600;700&display=swap'
      document.head.appendChild(link)
    }
    return undefined
  }, [])

  useEffect(() => {
    if (!token) {
      setShowOnboarding(false)
      return
    }
    setShowOnboarding(computeShouldShowOnboarding(token))
  }, [token])

  useEffect(() => {
    if (!token) {
      removeLocalStorageItem('user_email')
      return
    }

    applyToken(token)

    let cancelled = false
    const controller = new AbortController()

    ;(async () => {
      try {
        const { data } = await api.get('/api/v1/auth/me', { signal: controller.signal })
        if (cancelled) return
        const resolvedEmail = data?.email || getStoredEmail()
        setUserEmail(resolvedEmail)
        setLocalStorageItem('user_email', resolvedEmail)
      } catch (error) {
        if (cancelled) return
        const fallbackEmail = getStoredEmail()
        setUserEmail(fallbackEmail)
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [token])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brand.shortName} · Operations Cockpit`
    }
  }, [])

  const handleLogin = useCallback((newToken, email) => {
    if (!newToken) return
    setToken(newToken)
    applyToken(newToken)
    setLocalStorageItem('token', newToken)
    if (email) {
      setLocalStorageItem('user_email', email)
      setUserEmail(email)
    }
    removeLocalStorageItem('onb_snooze_until')
    setShowOnboarding(computeShouldShowOnboarding(newToken))
  }, [])

  const handleLogout = useCallback(() => {
    setToken('')
    setUserEmail('')
    setShowOnboarding(false)
    removeLocalStorageItem('token')
    removeLocalStorageItem('user_email')
    removeLocalStorageItem('onb_snooze_until')
    removeLocalStorageItem('onb_seen')
    delete api.defaults.headers.common['Authorization']
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

  const plannerProps = useMemo(() => ({ onLogout: handleLogout }), [handleLogout])

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <Planner {...plannerProps} />
      {showOnboarding && userEmail && (
        <OnboardingOverlay
          email={userEmail}
          onClose={handleSnoozeOnboarding}
          onSnooze={handleSnoozeOnboarding}
          onFinish={handleFinishOnboarding}
        />
      )}
    </>
  )
}
