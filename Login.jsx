import React, { useState } from 'react'
import { api, setToken } from './api.js'

export default function Login({ onLogin }) {
  const [user, setUser] = useState('bart')
  const [password, setPassword] = useState('mr-dj')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // Map username to email format
      let email
      if (user === 'bart') {
        email = 'bart@rentguy.demo'
      } else if (user === 'rentguy') {
        email = 'rentguy@demo.local'
      } else {
        email = `${user}@demo.local`
      }
      
      const form = new FormData()
      form.append('email', email)
      form.append('password', password)
      const { data } = await api.post('/api/v1/auth/login', form)
      setToken(data.access_token)
      onLogin(data.access_token, email)
    } catch (err) {
      setError('Login mislukt. Controleer gegevens.')
    }
  }

  return (
    <div style={{maxWidth: 400, margin: '80px auto', fontFamily: 'system-ui', padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
      <h1 style={{textAlign: 'center', color: '#333'}}>🎵 RentGuy – Login</h1>
      <div style={{background: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
        <p style={{margin: 0, fontSize: '14px'}}>
          <strong>Demo Credentials:</strong><br/>
          👤 <b>Bart:</b> user: <code>bart</code> / password: <code>mr-dj</code><br/>
          👤 <b>Demo:</b> user: <code>rentguy</code> / password: <code>rentguy</code>
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <label style={{display: 'block', marginBottom: '10px'}}>
          Gebruikersnaam<br/>
          <input 
            value={user} 
            onChange={e=>setUser(e.target.value)} 
            style={{width:'100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px'}} 
            placeholder="bart of rentguy"
          />
        </label>
        <label style={{display: 'block', marginBottom: '20px'}}>
          Wachtwoord<br/>
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            style={{width:'100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px'}} 
            placeholder="mr-dj of rentguy"
          />
        </label>
        <button style={{
          width: '100%', 
          padding: '12px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          🚀 Inloggen
        </button>
        {error && <p style={{color:'crimson', textAlign: 'center', marginTop: '10px'}}>{error}</p>}
      </form>
    </div>
  )
}
