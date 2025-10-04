import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('rentguy_auth_token');
        const storedUser = localStorage.getItem('rentguy_user');
        
        if (storedToken && storedUser) {
          // Validate token expiration
          const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenData.exp > currentTime) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token expired, clear storage
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user } = await response.json();

      // Store in localStorage
      localStorage.setItem('rentguy_auth_token', token);
      localStorage.setItem('rentguy_user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const { token, user } = await response.json();

      localStorage.setItem('rentguy_auth_token', token);
      localStorage.setItem('rentguy_user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rentguy_auth_token');
    localStorage.removeItem('rentguy_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('rentguy_user', JSON.stringify(updatedUser));
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
