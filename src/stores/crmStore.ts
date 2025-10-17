
import create from 'zustand';
import { produce } from 'immer';
import axios from 'axios';

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

export const crmStore = create<CRMState>((set) => ({
  customers: [],
  activities: [],
  loading: false,
  error: null,

  fetchCustomers: async () => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await axios.get('http://localhost:8000/api/crm/customers');
      set(produce((state) => { 
        state.customers = response.data;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => { 
        state.error = error instanceof Error ? error.message : 'Fetch customers failed';
        state.loading = false;
      }));
    }
  },

  createCustomer: async (customer) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await axios.post('http://localhost:8000/api/crm/customers', customer);
      set(produce((state) => { 
        state.customers.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => { 
        state.error = error instanceof Error ? error.message : 'Create customer failed';
        state.loading = false;
      }));
    }
  },

  updateCustomer: async (customer) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await axios.put(`http://localhost:8000/api/crm/customers/${customer.id}`, customer);
      set(produce((state) => { 
        const index = state.customers.findIndex(c => c.id === customer.id);
        if (index !== -1) state.customers[index] = response.data;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => { 
        state.error = error instanceof Error ? error.message : 'Update customer failed';
        state.loading = false;
      }));
    }
  },

  deleteCustomer: async (customerId) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      await axios.delete(`http://localhost:8000/api/crm/customers/${customerId}`);
      set(produce((state) => { 
        state.customers = state.customers.filter(c => c.id !== customerId);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => { 
        state.error = error instanceof Error ? error.message : 'Delete customer failed';
        state.loading = false;
      }));
    }
  },

  fetchActivities: async (customerId) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const url = customerId 
        ? `http://localhost:8000/api/crm/activities?customerId=${customerId}`
        : 'http://localhost:8000/api/crm/activities';
      const response = await axios.get(url);
      set(produce((state) => { 
        state.activities = response.data;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => { 
        state.error = error instanceof Error ? error.message : 'Fetch activities failed';
        state.loading = false;
      }));
    }
  },

  createActivity: async (activity) => {
    set(produce((state) => { state.loading = true; state.error = null; }));
    try {
      const response = await axios.post('http://localhost:8000/api/crm/activities', activity);
      set(produce((state) => { 
        state.activities.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state) => { 
        state.error = error instanceof Error ? error.message : 'Create activity failed';
        state.loading = false;
      }));
    }
  },
}));

export default crmStore;
