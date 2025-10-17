import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authStore } from './authStore'; // Update import path according to your project structure

export const AuthSpinner = () => (
  <div className="auth-spinner">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <p>Authenticating...</p>
  </div>
);

export const AccessDenied = () => {
  const location = useLocation();
  return (
    <div className="access-denied">
      <h1>403 - Access Denied</h1>
      <p>You don't have permission to access {location.pathname}</p>
      <Navigate to="/" replace />
    </div>
  );
};

export const useAuthGuard = (requiredPermissions?: string[], strategy: 'all' | 'any' = 'all') => {
  const { isAuthenticated, checkAuth, permissions, isLoading } = authStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth, location.pathname]);

  const hasPermissions = () => {
    if (!requiredPermissions) return true;
    return strategy === 'all'
      ? requiredPermissions.every(p => permissions.includes(p))
      : requiredPermissions.some(p => permissions.includes(p));
  };

  return {
    isAuthenticated,
    isLoading,
    isAuthorized: hasPermissions(),
    requiredPermissions,
  };
};

type ProtectedRouteProps = {
  children?: React.ReactElement;
  requiredPermissions?: string[];
  permissionStrategy?: 'all' | 'any';
};

export const ProtectedRoute = ({
  children,
  requiredPermissions,
  permissionStrategy = 'all',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, isAuthorized } = useAuthGuard(requiredPermissions, permissionStrategy);
  const location = useLocation();

  if (isLoading) {
    return <AuthSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return children ? children : <Outlet />;
};

// Optional: Add basic CSS for components
const styles = `
  .auth-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 1rem;
  }

  .access-denied {
    text-align: center;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }
`;

// Inject styles (consider using CSS modules or styled-components in real project)
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);
