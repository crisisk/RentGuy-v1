import apiClient from './client';
import { User, UserRole } from '../types';

// Mock data for initial integration
const mockUsers: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@rg.com', role: 'admin' },
    { id: 'u2', name: 'Finance Manager', email: 'finance@rg.com', role: 'finance' },
    { id: 'u3', name: 'Crew Member', email: 'crew@rg.com', role: 'crew' },
];

export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    // const response = await apiClient.get('/users');
    // return response.data;
    return mockUsers;
  },

  create: async (user: Partial<User>): Promise<User> => {
    // const response = await apiClient.post('/users', user);
    // return response.data;
    const newUser: User = { ...user as User, id: `u${mockUsers.length + 1}`, role: user.role || 'crew' };
    mockUsers.push(newUser);
    return newUser;
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    // const response = await apiClient.patch(`/users/${id}`, updates);
    // return response.data;
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...updates };
    return mockUsers[index];
  },

  delete: async (id: string): Promise<void> => {
    // await apiClient.delete(`/users/${id}`);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) mockUsers.splice(index, 1);
  },

  updateRole: async (id: string, role: UserRole): Promise<void> => {
    // await apiClient.patch(`/users/${id}/role`, { role });
    const user = mockUsers.find(u => u.id === id);
    if (user) user.role = role;
  },

  resetPassword: async (id: string): Promise<void> => {
    // await apiClient.post(`/users/${id}/reset-password`);
    console.log(`Mock: Sent password reset email to user ${id}`);
  },

  toggleStatus: async (id: string, active: boolean): Promise<void> => {
    // await apiClient.patch(`/users/${id}/status`, { active });
    console.log(`Mock: Toggled status for user ${id} to active=${active}`);
  },

  getSessions: async (id: string) => {
    // const response = await apiClient.get(`/users/${id}/sessions`);
    // return response.data;
    return [{ id: 's1', device: 'Chrome on Windows', lastActive: new Date().toISOString() }];
  },

  terminateSession: async (userId: string, sessionId: string): Promise<void> => {
    // await apiClient.delete(`/users/${userId}/sessions/${sessionId}`);
    console.log(`Mock: Terminated session ${sessionId} for user ${userId}`);
  },
};

