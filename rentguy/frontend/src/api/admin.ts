import apiClient from './client';
import { User, Role } from '../types';

const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: '2', name: 'Manager User', email: 'manager@example.com', role: 'manager' },
];

const mockRoles: Role[] = [
  { id: '1', name: 'admin' },
  { id: '2', name: 'manager' },
  { id: '3', name: 'crew' },
  { id: '4', name: 'finance' },
];

export const getUsers = async (): Promise<User[]> => {
  // const response = await apiClient.get('/users');
  // return response.data;
  return mockUsers;
};

export const getRoles = async (): Promise<Role[]> => {
  // const response = await apiClient.get('/roles');
  // return response.data;
  return mockRoles;
};

