import { createAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const { user, logout } = createAuthStore();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Profile
      </h1>
      
      {user ? (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.5rem' }}>
              Name
            </label>
            <div style={{ fontSize: '1rem', color: '#111827' }}>
              {user.name || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.5rem' }}>
              Email
            </label>
            <div style={{ fontSize: '1rem', color: '#111827' }}>
              {user.email || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.5rem' }}>
              Role
            </label>
            <div style={{ fontSize: '1rem', color: '#111827' }}>
              {user.role || 'N/A'}
            </div>
          </div>
          
          <button
            onClick={logout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
          No user data available
        </div>
      )}
    </div>
  );
}

