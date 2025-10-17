import { create } from 'zustand';
import { produce } from 'immer';
import axios from 'axios';
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
export const adminStore = create<AdminState>((set) => ({
    users: [],
    roles: [],
    settings: {},
    loading: false,
    error: null,
    fetchUsers: async () => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await axios.get('http://localhost:8000/api/v1/admin/users');
            set(produce((state: AdminState) => { state.users = response.data; }));
        } catch (error: any) {
            set(produce((state: AdminState) => { state.error = error.message; }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    createUser: async (user) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await axios.post('http://localhost:8000/api/v1/admin/users', user);
            set(produce((state: AdminState) => { state.users.push(response.data); }));
        } catch (error: any) {
            set(produce((state: AdminState) => { state.error = error.message; }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    updateUser: async (id, userData) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await axios.put(`http://localhost:8000/api/v1/admin/users/${id}`, userData);
            set(produce((state: AdminState) => {
                state.users = state.users.map((u: any) => u.id === id ? response.data : u);
            }));
        } catch (error: any) {
            set(produce((state: AdminState) => { state.error = error.message; }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    deleteUser: async (id) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            await axios.delete(`http://localhost:8000/api/v1/admin/users/${id}`);
            set(produce((state: AdminState) => {
                state.users = state.users.filter((u: any) => u.id !== id);
            }));
        } catch (error: any) {
            set(produce((state: AdminState) => { state.error = error.message; }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    fetchRoles: async () => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await axios.get('http://localhost:8000/api/v1/admin/roles');
            set(produce((state: AdminState) => { state.roles = response.data; }));
        } catch (error: any) {
            set(produce((state: AdminState) => { state.error = error.message; }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    },
    updateSettings: async (settings) => {
        set(produce((state: AdminState) => { state.loading = true; }));
        try {
            const response = await axios.patch('http://localhost:8000/api/v1/admin/settings', settings);
            set(produce((state: AdminState) => { state.settings = response.data; }));
        } catch (error: any) {
            set(produce((state: AdminState) => { state.error = error.message; }));
        } finally {
            set(produce((state: AdminState) => { state.loading = false; }));
        }
    }
}));
export default adminStore;
