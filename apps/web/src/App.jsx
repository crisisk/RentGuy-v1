import React, { useState } from 'react'
import Login from './Login.jsx'
import Planner from './Planner.jsx'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  if (!token) {
    return <Login onLogin={(t)=>{ localStorage.setItem('token', t); setToken(t) }} />
  }
  return <Planner onLogout={()=>{ localStorage.removeItem('token'); location.reload() }} />
}
