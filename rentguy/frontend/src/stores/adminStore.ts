import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User, Role } from '../types';
import * as adminApi from '../api/admin';

interface AdminState {
  users: User[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
}

export const useAdminStore = create<AdminState>()(immer((set) => ({
  users: [],
  roles: [],
  isLoading: false,
  error: null,
  fetchUsers: async () => {
    try {
      set({ isLoading: true });
      const users = await adminApi.getUsers();
      set({ users, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchRoles: async () => {
    try {
      set({ isLoading: true });
      const roles = await adminApi.getRoles();
      set({ roles, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

