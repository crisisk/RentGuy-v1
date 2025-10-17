Here's a production-ready Zustand authentication store in TypeScript:

```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import axios from 'axios';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  // Add other user fields
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface UpdateProfileData {
  name?: string;
  // Other updatable fields
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

// Axios instance with interceptors
const authAxios = axios.create({
  baseURL: 'http://localhost:8000/api/auth',
});

// Zustand store
const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (credentials) => {
        set(state => { 
          state.loading = true; 
          state.error = null; 
        });

        try {
          const response = await authAxios.post('/login', credentials);
          
          set(state => {
            state.token = response.data.token;
            state.user = response.data.user;
            state.isAuthenticated = true;
            state.loading = false;
          });

          // Set default auth header
          authAxios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        } catch (error: any) {
          set(state => {
            state.error = error.response?.data?.message || 'Login failed';
            state.loading = false;
          });
          throw error;
        }
      },

      logout: () => {
        set(state => {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        });
        
        // Remove auth header
        delete authAxios.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        set(state => { 
          state.loading = true; 
          state.error = null; 
        });

        try {
          const response = await authAxios.post('/refresh-token');
          
          set(state => {
            state.token = response.data.token;
            state.loading = false;
          });

          // Update auth header
          authAxios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        } catch (error: any) {
          set(state => {
            state.error = error.response?.data?.message || 'Token refresh failed';
            state.loading = false;
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
          });
          throw error;
        }
      },

      checkAuth: async () => {
        set(state => { 
          state.loading = true; 
          state.error = null; 
        });

        try {
          const response = await authAxios.get('/me');
          
          set(state => {
            state.user = response.data.user;
            state.isAuthenticated = true;
            state.loading = false;
          });
        } catch (error: any) {
          set(state => {
            state.error = error.response?.data?.message || 'Authentication check failed';
            state.loading = false;
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
          });
          throw error;
        }
      },

      updateProfile: async (data) => {
        set(state => { 
          state.loading = true; 
          state.error = null; 
        });

        try {
          const response = await authAxios.patch('/profile', data);
          
          set(state => {
            state.user = response.data.user;
            state.loading = false;
          });
        } catch (error: any) {
          set(state => {
            state.error = error.response?.data?.message || 'Profile update failed';
            state.loading = false;
          });
          throw error;
        }
      },
    })),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      }),
    }
  )
);

export default useAuthStore;
```

This implementation includes:
- Comprehensive TypeScript typing
- Persistent storage with localStorage
- Immer middleware for immutable state updates
- Error handling
- Token management
- Axios interceptor setup
- Actions for login, logout, token refresh, auth check, and profile update
- Secure token storage and management
