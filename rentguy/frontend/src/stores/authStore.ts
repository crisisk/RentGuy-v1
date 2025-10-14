import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(immer((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { user } = await authApi.login({ email, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const { user } = await authApi.checkAuth();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
})));

