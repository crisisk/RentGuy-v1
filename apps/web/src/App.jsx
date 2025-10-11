import React, { useEffect, useState } from 'react'
import Login from './Login.jsx'
import Planner from './Planner.jsx'
import OnboardingOverlay from './OnboardingOverlay.jsx'
import { api, setToken as applyToken } from './api.js'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || '')
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onb_seen'))

  if (token && api.defaults.headers.common['Authorization'] !== `Bearer ${token}`) {
    applyToken(token)
  }

  useEffect(() => {
    if (!token) {
      return
    }
    ;(async () => {
      try {
        const { data } = await api.get('/api/v1/auth/me')
        setUserEmail(data.email)
        localStorage.setItem('user_email', data.email)
      } catch (error) {
        if (!userEmail) {
          const fallback = localStorage.getItem('user_email') || 'bart@rentguy.demo'
          setUserEmail(fallback)
        }
      }
    })()
  }, [token, userEmail])

  function handleLogin(newToken, email) {
    localStorage.setItem('token', newToken)
    if (email) {
      localStorage.setItem('user_email', email)
      setUserEmail(email)
    }
    applyToken(newToken)
    setToken(newToken)
    setShowOnboarding(!localStorage.getItem('onb_seen'))
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('onb_seen')
    delete api.defaults.headers.common['Authorization']
    setToken('')
    setUserEmail('')
    setShowOnboarding(true)
  }

  function dismissOnboarding() {
    localStorage.setItem('onb_seen', '1')
    setShowOnboarding(false)
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <Planner onLogout={handleLogout} />
      {showOnboarding && userEmail && (
        <OnboardingOverlay email={userEmail} onClose={dismissOnboarding} />
      )}
    </>
  )
}
