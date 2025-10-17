import { create } from 'zustand';
import { produce } from 'immer';
import axios, { AxiosError } from 'axios';

// Type definitions
type User = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  createdAt: string;
};

type Role = {
  id: string;
  name: string;
};

type Settings = Record<string, any>;

interface AdminState {
  users: User[];
  roles: Role[];
  settings: Settings;
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchRoles: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
}

const api = axios.create({
  baseURL: 'http://localhost:8000/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminStore = create<AdminState>((set) => ({
  users: [],
  roles: [],
  settings: {},
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users');
      set(produce((state) => {
        state.users = response.data;
        state.loading = false;
      }));
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      set({ 
        error: err.response?.data.message || 'Failed to fetch users',
        loading: false 
      });
    }
  },

  createUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/users', data);
      set(produce((state) => {
        state.users.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      set({ 
        error: err.response?.data.message || 'Failed to create user',
        loading: false 
      });
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/users/${id}`, data);
      set(produce((state) => {
        const index = state.users.findIndex(u => u.id === id);
        if (index !== -1) state.users[index] = response.data;
        state.loading = false;
      }));
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      set({ 
        error: err.response?.data.message || 'Failed to update user',
        loading: false 
      });
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/users/${id}`);
      set(produce((state) => {
        state.users = state.users.filter(u => u.id !== id);
        state.loading = false;
      }));
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      set({ 
        error: err.response?.data.message || 'Failed to delete user',
        loading: false 
      });
    }
  },

  fetchRoles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/roles');
      set(produce((state) => {
        state.roles = response.data;
        state.loading = false;
      }));
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      set({ 
        error: err.response?.data.message || 'Failed to fetch roles',
        loading: false 
      });
    }
  },

  updateSettings: async (settings) => {
    set({ loading: true, error: null });
    try {
      await api.put('/settings', settings);
      set(produce((state) => {
        state.settings = { ...state.settings, ...settings };
        state.loading = false;
      }));
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      set({ 
        error: err.response?.data.message || 'Failed to update settings',
        loading: false 
      });
    }
  },
}));

Key features:
1. Strong TypeScript typing for all state and actions
2. Immer middleware integration for safe state mutations
3. Axios instance with base configuration
4. Comprehensive error handling with type-safe error casting
5. Loading state management for UI feedback
6. Proper RESTful API endpoint structure
7. Immutable updates using spread operators and array methods
8. Error messages from server response or fallback messages
9. Separation of concerns with all admin-related operations in one store
10. Production-ready error handling patterns with try/catch blocks

