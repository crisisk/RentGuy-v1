import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = createAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#F9FAFB'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
          RentGuy Enterprise
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          {error && (
            <div style={{ 
              padding: '0.75rem', 
              marginBottom: '1rem', 
              background: '#FEE2E2', 
              color: '#991B1B',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

