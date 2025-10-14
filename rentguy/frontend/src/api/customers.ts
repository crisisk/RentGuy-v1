import apiClient from './client';
import { Customer, Activity } from '../types';

// Mock data for initial integration
const mockCustomers: Customer[] = [
    { id: 'c1', name: 'Global Events Inc.', email: 'events@global.com', segment: 'vip' },
    { id: 'c2', name: 'Local Theatre Group', email: 'theatre@local.com', segment: 'regular' },
    { id: 'c3', name: 'New Startup Co.', email: 'startup@new.com', segment: 'new' },
];

const mockActivities: Activity[] = [
    { id: 'a1', type: 'call', timestamp: '2025-10-14T10:00:00Z', content: 'Discussed Q4 event needs.' },
    { id: 'a2', type: 'email', timestamp: '2025-10-13T15:30:00Z', content: 'Sent quote Q1.' },
];

export const customersAPI = {
  getAll: async (filters?: {
    segment?: 'vip' | 'regular' | 'new';
    search?: string;
  }): Promise<Customer[]> => {
    // const response = await apiClient.get('/customers', { params: filters });
    // return response.data;
    let filteredCustomers = mockCustomers;
    if (filters?.segment) {
        filteredCustomers = filteredCustomers.filter(c => c.segment === filters.segment);
    }
    return filteredCustomers;
  },

  getById: async (id: string): Promise<Customer> => {
    // const response = await apiClient.get(`/customers/${id}`);
    // return response.data;
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  },

  create: async (customer: Partial<Customer>): Promise<Customer> => {
    // const response = await apiClient.post('/customers', customer);
    // return response.data;
    const newCustomer: Customer = { ...customer as Customer, id: `c${mockCustomers.length + 1}`, segment: customer.segment || 'regular' };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    // const response = await apiClient.patch(`/customers/${id}`, updates);
    // return response.data;
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    mockCustomers[index] = { ...mockCustomers[index], ...updates };
    return mockCustomers[index];
  },

  // Activities
  getActivities: async (customerId: string): Promise<Activity[]> => {
    // const response = await apiClient.get(`/customers/${customerId}/activities`);
    // return response.data;
    return mockActivities;
  },

  logActivity: async (customerId: string, activity: Partial<Activity>) => {
    // const response = await apiClient.post(`/customers/${customerId}/activities`, activity);
    // return response.data;
    const newActivity: Activity = { ...activity as Activity, id: `a${mockActivities.length + 1}`, timestamp: new Date().toISOString() };
    mockActivities.push(newActivity);
    return newActivity;
  },

  // Documents
  getDocuments: async (customerId: string) => {
    // const response = await apiClient.get(`/customers/${customerId}/documents`);
    // return response.data;
    return [{ id: 'd1', name: 'Master Contract 2025.pdf', url: '/mock/contract.pdf' }];
  },

  uploadDocument: async (customerId: string, file: File, type: string) => {
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('type', type);
    // const response = await apiClient.post(`/customers/${customerId}/documents`, formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    // return response.data;
    console.log(`Mock: Uploaded document of type ${type} for customer ${customerId}`);
    return { success: true };
  },
};

