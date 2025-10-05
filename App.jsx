import React, { useState, useEffect } from 'react'
import Login from './Login.jsx'
import OnboardingOverlay from './OnboardingOverlay.jsx'
import Planner from './Planner.jsx'
import { api } from './api.js'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (token) {
      // Get user info from token or API
      const getUserInfo = async () => {
        try {
          const response = await api.get('/api/v1/auth/me')
          setUserEmail(response.data.email)
        } catch (error) {
          // Fallback to stored email or default
          const storedEmail = localStorage.getItem('user_email') || 'bart@rentguy.demo'
          setUserEmail(storedEmail)
        }
      }
      getUserInfo()
    }
  }, [token])

  const handleLogin = (t, email) => {
    localStorage.setItem('token', t)
    localStorage.setItem('user_email', email || 'bart@rentguy.demo')
    setToken(t)
    setUserEmail(email || 'bart@rentguy.demo')
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }
  
  return <>
    <Planner onLogout={()=>{ 
      localStorage.removeItem('token')
      localStorage.removeItem('user_email')
      localStorage.removeItem('onb_seen')
      location.reload() 
    }} />
    {(!localStorage.getItem('onb_seen')) && userEmail && 
      <OnboardingOverlay 
        email={userEmail} 
        onClose={()=>{
          localStorage.setItem('onb_seen','1')
          location.reload()
        }} 
      />
    }
  </>
}
