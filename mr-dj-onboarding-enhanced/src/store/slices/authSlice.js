// Authentication slice for Zustand store
export const authSlice = (set, get) => ({
  auth: {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    lastLoginTime: null,
    tokenExpiry: null,
    permissions: [],
    role: null,
  },

  // Authentication actions
  login: async (credentials) => {
    set((state) => {
      state.auth.isLoading = true;
      state.updateTimestamp();
    });

    try {
      // Simulate API call - replace with actual authentication service
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const authData = await response.json();

      set((state) => {
        state.auth.user = authData.user;
        state.auth.token = authData.token;
        state.auth.refreshToken = authData.refreshToken;
        state.auth.isAuthenticated = true;
        state.auth.isLoading = false;
        state.auth.lastLoginTime = Date.now();
        state.auth.tokenExpiry = authData.expiresAt;
        state.auth.permissions = authData.permissions || [];
        state.auth.role = authData.user?.role || 'user';
        state.updateTimestamp();
      });

      // Clear any existing auth errors
      get().clearErrors('auth');

      return { success: true, user: authData.user };
    } catch (error) {
      set((state) => {
        state.auth.isLoading = false;
        state.updateTimestamp();
      });

      // Add error to error slice
      get().addError({
        id: `auth-${Date.now()}`,
        type: 'auth',
        message: error.message || 'Login failed',
        timestamp: Date.now(),
      });

      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    set((state) => {
      state.auth.isLoading = true;
      state.updateTimestamp();
    });

    try {
      // Call logout API if token exists
      const token = get().auth.token;
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear auth state regardless of API call result
      set((state) => {
        state.auth = {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          lastLoginTime: null,
          tokenExpiry: null,
          permissions: [],
          role: null,
        };
        state.updateTimestamp();
      });

      // Clear auth-related errors
      get().clearErrors('auth');
    }
  },

  updateUser: (userData) => {
    set((state) => {
      if (state.auth.user) {
        state.auth.user = { ...state.auth.user, ...userData };
        state.updateTimestamp();
      }
    });
  },

  refreshToken: async () => {
    const currentRefreshToken = get().auth.refreshToken;
    
    if (!currentRefreshToken) {
      get().logout();
      return { success: false, error: 'No refresh token available' };
    }

    set((state) => {
      state.auth.isLoading = true;
      state.updateTimestamp();
    });

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const authData = await response.json();

      set((state) => {
        state.auth.token = authData.token;
        state.auth.refreshToken = authData.refreshToken;
        state.auth.tokenExpiry = authData.expiresAt;
        state.auth.isLoading = false;
        state.updateTimestamp();
      });

      return { success: true };
    } catch (error) {
      // If refresh fails, logout user
      get().logout();
      
      get().addError({
        id: `auth-refresh-${Date.now()}`,
        type: 'auth',
        message: 'Session expired. Please login again.',
        timestamp: Date.now(),
      });

      return { success: false, error: error.message };
    }
  },

  // Check if token is expired or about to expire
  isTokenExpired: () => {
    const { tokenExpiry } = get().auth;
    if (!tokenExpiry) return true;
    
    // Consider token expired if it expires within 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() >= (tokenExpiry - fiveMinutes);
  },

  // Check if user has specific permission
  hasPermission: (permission) => {
    const { permissions, role } = get().auth;
    
    // Admin role has all permissions
    if (role === 'admin') return true;
    
    return permissions.includes(permission);
  },

  // Check if user has any of the specified roles
  hasRole: (roles) => {
    const { role } = get().auth;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(role);
  },

  // Update user permissions
  updatePermissions: (newPermissions) => {
    set((state) => {
      state.auth.permissions = newPermissions;
      state.updateTimestamp();
    });
  },

  // Set authentication loading state
  setAuthLoading: (isLoading) => {
    set((state) => {
      state.auth.isLoading = isLoading;
      state.updateTimestamp();
    });
  },

  // Validate current session
  validateSession: async () => {
    const { token, isAuthenticated } = get().auth;
    
    if (!isAuthenticated || !token) {
      return { valid: false, reason: 'No active session' };
    }

    if (get().isTokenExpired()) {
      // Try to refresh token
      const refreshResult = await get().refreshToken();
      if (!refreshResult.success) {
        return { valid: false, reason: 'Token expired and refresh failed' };
      }
    }

    try {
      // Validate token with server
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${get().auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const validationData = await response.json();
      
      // Update user data if provided
      if (validationData.user) {
        get().updateUser(validationData.user);
      }

      return { valid: true, user: validationData.user };
    } catch (error) {
      get().logout();
      return { valid: false, reason: error.message };
    }
  },
});

// Initial state getter for reset functionality
authSlice.getInitialState = () => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  lastLoginTime: null,
  tokenExpiry: null,
  permissions: [],
  role: null,
});

export default authSlice;
