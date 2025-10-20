import { create } from 'zustand'
import { produce } from 'immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'

interface AdminState {
    users: any[];
    roles: any[];
    settings: Record<string, any>;
    loading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    createUser: (user: any) => Promise<void>;
    updateUser: (id: string, userData: any) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    fetchRoles: () => Promise<void>;
    updateSettings: (settings: Record<string, any>) => Promise<void>;
}

const ADMIN_BASE_PATH = '/api/v1/admin'

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message
}

export const adminStore = create<AdminState>((set) => ({
    users: [],
    roles: [],
    settings: {},
    loading: false,
    error: null,
    fetchUsers: async () => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await api.get(`${ADMIN_BASE_PATH}/users`);
            set(produce((state: AdminState) => { state.users = Array.isArray(response.data) ? response.data : []; }));
        } catch (error: unknown) {
            set(produce((state: AdminState) => { state.error = resolveError(error); }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    createUser: async (user) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await api.post(`${ADMIN_BASE_PATH}/users`, user);
            set(produce((state: AdminState) => {
                if (response.data) {
                    state.users.push(response.data);
                }
            }));
        } catch (error: unknown) {
            set(produce((state: AdminState) => { state.error = resolveError(error); }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    updateUser: async (id, userData) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await api.put(`${ADMIN_BASE_PATH}/users/${id}`, userData);
            set(produce((state: AdminState) => {
                state.users = state.users.map((u: any) => (u.id === id && response.data ? response.data : u));
            }));
        } catch (error: unknown) {
            set(produce((state: AdminState) => { state.error = resolveError(error); }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    deleteUser: async (id) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            await api.delete(`${ADMIN_BASE_PATH}/users/${id}`);
            set(produce((state: AdminState) => {
                state.users = state.users.filter((u: any) => u.id !== id);
            }));
        } catch (error: unknown) {
            set(produce((state: AdminState) => { state.error = resolveError(error); }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    fetchRoles: async () => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await api.get(`${ADMIN_BASE_PATH}/roles`);
            set(produce((state: AdminState) => { state.roles = Array.isArray(response.data) ? response.data : []; }));
        } catch (error: unknown) {
            set(produce((state: AdminState) => { state.error = resolveError(error); }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    updateSettings: async (settings) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await api.patch(`${ADMIN_BASE_PATH}/settings`, settings);
            set(produce((state: AdminState) => {
                state.settings = response.data ?? state.settings;
            }));
        } catch (error: unknown) {
            set(produce((state: AdminState) => { state.error = resolveError(error); }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    }
}));

export default adminStore;
