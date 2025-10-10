import React, { useState, useEffect } from 'react'
import Login from './Login.jsx'
import OnboardingOverlay from './OnboardingOverlay.jsx'
import Planner from './Planner.jsx'
import { api, setToken as applyToken } from './api.js'
import { brand, brandFontStack } from './branding.js'
import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './storage.js'

export default function App() {
  const [token, setToken] = useState(() => getLocalStorageItem('token', ''))
  const [userEmail, setUserEmail] = useState(() => getLocalStorageItem('user_email', ''))
  const [overlayDismissed, setOverlayDismissed] = useState(
    () => getLocalStorageItem('onb_seen', '') === '1'
  )

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
      const previousStyles = {
        background: document.body.style.background,
        color: document.body.style.color,
        fontFamily: document.body.style.fontFamily,
      }
      document.body.style.background = `${brand.colors.surface}`
      document.body.style.color = brand.colors.text
      document.body.style.fontFamily = brandFontStack
      return () => {
        document.body.style.background = previousStyles.background
        document.body.style.color = previousStyles.color
        document.body.style.fontFamily = previousStyles.fontFamily
      }
    }
  }, [])

  const handleLogin = (t, email) => {
    setLocalStorageItem('token', t)
    setLocalStorageItem('user_email', email || 'bart@rentguy.demo')
    setToken(t)
    setUserEmail(email || 'bart@rentguy.demo')
    setOverlayDismissed(getLocalStorageItem('onb_seen', '') === '1')
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }
  
  return <>
    <Planner
      onLogout={() => {
        applyToken('')
        removeLocalStorageItem('token')
        removeLocalStorageItem('user_email')
        clearOnboardingState()
        setToken('')
        setUserEmail('')
        setOverlayDismissed(false)
      }}
    />
    {!overlayDismissed && userEmail && (
      <OnboardingOverlay
        email={userEmail}
        onClose={() => {
          setLocalStorageItem('onb_seen', '1')
          setOverlayDismissed(true)
        }}
      />
    )}
  </>
}
