import React, { useState } from 'react'
import { api, setToken } from './api.js'

export default function Login({ onLogin }) {
  const [user, setUser] = useState('rentguy')
  const [password, setPassword] = useState('rentguy')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // backend expects email; map username -> email
      const email = `${user}@demo.local`
      const form = new FormData()
      form.append('email', email)
      form.append('password', password)
      const { data } = await api.post('/api/v1/auth/login', form)
      setToken(data.access_token)
      onLogin(data.access_token)
    } catch (err) {
      setError('Login mislukt. Controleer gegevens.')
    }
  }

  return (
    <div style={{maxWidth: 380, margin: '80px auto', fontFamily: 'system-ui'}}>
      <h1>Rentguy – Login</h1>
      <p>Log in met <b>user: rentguy</b> en <b>password: rentguy</b></p>
      <form onSubmit={handleSubmit}>
        <label>Gebruikersnaam<br/>
          <input value={user} onChange={e=>setUser(e.target.value)} style={{width:'100%'}} />
        </label>
        <br/><br/>
        <label>Wachtwoord<br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%'}} />
        </label>
        <br/><br/>
        <button>Inloggen</button>
        {error && <p style={{color:'crimson'}}>{error}</p>}
      </form>
    </div>
  )
}
