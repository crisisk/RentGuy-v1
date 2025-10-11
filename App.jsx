import React, { useState, useEffect, useCallback } from 'react'
import Login from './Login.jsx'
import OnboardingOverlay from './OnboardingOverlay.jsx'
import Planner from './Planner.jsx'
import { api } from './api.js'
import { brand, brandFontStack } from './branding.js'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './storage.js'

const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 6 // 6 uur

function computeShouldShowOnboarding() {
  const seen = getLocalStorageItem('onb_seen', '0') === '1'
  if (seen) return false
  const snoozeRaw = getLocalStorageItem('onb_snooze_until', '')
  const snoozeUntil = Number.parseInt(snoozeRaw, 10)
  if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) {
    return false
  }
  return true
}

export default function App() {
  const [token, setToken] = useState(() => getLocalStorageItem('token', ''))
  const [userEmail, setUserEmail] = useState(() => getLocalStorageItem('user_email', ''))
  const [showOnboarding, setShowOnboarding] = useState(computeShouldShowOnboarding)

  useEffect(() => {
    if (token) {
      // Get user info from token or API
      const getUserInfo = async () => {
        try {
          const response = await api.get('/api/v1/auth/me')
          setUserEmail(response.data.email)
        } catch (error) {
          // Fallback to stored email or default
          const storedEmail = getLocalStorageItem('user_email', 'bart@rentguy.demo')
          setUserEmail(storedEmail)
        }
      }
      getUserInfo()
    }
  }, [token])

  useEffect(() => {
    if (typeof document !== 'undefined') {
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
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brand.shortName} × ${brand.tenant.name}`
    }
  }, [])

  const handleLogin = (t, email) => {
    setLocalStorageItem('token', t)
    setLocalStorageItem('user_email', email || 'bart@rentguy.demo')
    setToken(t)
    setUserEmail(email || 'bart@rentguy.demo')
    setShowOnboarding(computeShouldShowOnboarding())
  }

  useEffect(() => {
    if (token) {
      setShowOnboarding(computeShouldShowOnboarding())
    } else {
      setShowOnboarding(false)
    }
  }, [token])

  const handleLogout = useCallback(() => {
    removeLocalStorageItem('token')
    removeLocalStorageItem('user_email')
    clearOnboardingState()
    setToken('')
    setUserEmail('')
    setShowOnboarding(false)
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

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return <>
    <Planner onLogout={handleLogout} />
    {showOnboarding && userEmail &&
      <OnboardingOverlay
        email={userEmail}
        onSnooze={handleSnoozeOnboarding}
        onFinish={handleFinishOnboarding}
      />
    }
  </>
}
