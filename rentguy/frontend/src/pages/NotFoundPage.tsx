import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#F9FAFB',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ 
          fontSize: '6rem', 
          fontWeight: 'bold', 
          color: '#007AFF',
          marginBottom: '1rem',
          lineHeight: 1
        }}>
          404
        </h1>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Page Not Found
        </h2>
        <p style={{ 
          fontSize: '1rem', 
          color: '#6B7280',
          marginBottom: '2rem'
        }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/dashboard"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: '#007AFF',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

