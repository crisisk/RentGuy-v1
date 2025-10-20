import create from 'zustand';
import { produce } from 'immer';
import { api } from '@infra/http/api';
import { mapUnknownToApiError } from '@errors';
export interface Customer {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}
export interface Activity {
  id?: number;
  customerId: number;
  type: string;
  description: string;
  date: string;
}
export interface CRMState {
  customers: Customer[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  createCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: number) => Promise<void>;
  fetchActivities: (customerId?: number) => Promise<void>;
  createActivity: (activity: Activity) => Promise<void>;
}
const CRM_BASE_PATH = '/api/v1/crm';

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message;
}

export const crmStore = create<CRMState>((set) => ({
  customers: [],
  activities: [],
  loading: false,
  error: null,
  fetchCustomers: async () => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await api.get(`${CRM_BASE_PATH}/customers`);
      set(produce((state) => {
        state.customers = Array.isArray(response.data) ? response.data : [];
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  createCustomer: async (customer) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await api.post(`${CRM_BASE_PATH}/customers`, customer);
      set(produce((state) => {
        if (response.data) {
          state.customers.push(response.data as Customer);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  updateCustomer: async (customer) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await api.put(`${CRM_BASE_PATH}/customers/${customer.id}`, customer);
      set(produce((state) => {
        const index = state.customers.findIndex(c => c.id === customer.id);
        if (index !== -1 && response.data) state.customers[index] = response.data as Customer;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  deleteCustomer: async (customerId) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      await api.delete(`${CRM_BASE_PATH}/customers/${customerId}`);
      set(produce((state) => {
        state.customers = state.customers.filter(c => c.id !== customerId);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  fetchActivities: async (customerId) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const url = customerId
        ? `${CRM_BASE_PATH}/activities?customerId=${customerId}`
        : `${CRM_BASE_PATH}/activities`;
      const response = await api.get(url);
      set(produce((state) => {
        state.activities = Array.isArray(response.data) ? response.data : [];
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  createActivity: async (activity) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await api.post(`${CRM_BASE_PATH}/activities`, activity);
      set(produce((state) => {
        if (response.data) {
          state.activities.push(response.data as Activity);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
}));
export default crmStore;

