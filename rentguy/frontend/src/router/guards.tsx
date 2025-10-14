import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { ReactNode } from 'react';

export const AuthGuard = ({
  children,
  allowedRoles
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/not-found" replace />;
  }

  return <>{children}</>;
};

export const PublicGuard = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

