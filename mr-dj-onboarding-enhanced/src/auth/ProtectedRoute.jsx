import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, fallbackPath = '/login' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
        <div className="text-center text-white p-8 rounded-lg bg-black bg-opacity-20">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to access this page.</p>
          <p className="text-sm opacity-75">Required role: {requiredRole}</p>
          <p className="text-sm opacity-75">Your role: {user?.role || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
