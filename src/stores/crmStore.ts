import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import axios from 'axios';

// Type Definitions
export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface Contact {
  id?: string;
  customerId: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface Activity {
  id?: string;
  customerId: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  timestamp: Date;
}

interface CRMState {
  customers: Customer[];
  contacts: Contact[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  createCustomer: (data: Customer) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  fetchContacts: (customerId: string) => Promise<void>;
  createContact: (data: Contact) => Promise<void>;
  logActivity: (data: Activity) => Promise<void>;
}

const BASE_URL = 'http://localhost:8000/api/crm';

export const useCRMStore = create<CRMState>()(
  immer((set, get) => ({
    customers: [],
    contacts: [],
    activities: [],
    loading: false,
    error: null,

    fetchCustomers: async () => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.get<Customer[]>(`${BASE_URL}/customers`);
        set(state => {
          state.customers = response.data;
          state.loading = false;
        });
      } catch (err) {
        set(state => {
          state.error = err instanceof Error ? err.message : 'Failed to fetch customers';
          state.loading = false;
        });
      }
    },

    createCustomer: async (data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.post<Customer>(`${BASE_URL}/customers`, data);
        set(state => {
          state.customers.push(response.data);
          state.loading = false;
        });
      } catch (err) {
        set(state => {
          state.error = err instanceof Error ? err.message : 'Failed to create customer';
          state.loading = false;
        });
      }
    },

    updateCustomer: async (id, data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.patch<Customer>(`${BASE_URL}/customers/${id}`, data);
        set(state => {
          const index = state.customers.findIndex(c => c.id === id);
          if (index !== -1) {
            state.customers[index] = response.data;
          }
          state.loading = false;
        });
      } catch (err) {
        set(state => {
          state.error = err instanceof Error ? err.message : 'Failed to update customer';
          state.loading = false;
        });
      }
    },

    fetchContacts: async (customerId) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.get<Contact[]>(`${BASE_URL}/contacts?customerId=${customerId}`);
        set(state => {
          state.contacts = response.data;
          state.loading = false;
        });
      } catch (err) {
        set(state => {
          state.error = err instanceof Error ? err.message : 'Failed to fetch contacts';
          state.loading = false;
        });
      }
    },

    createContact: async (data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.post<Contact>(`${BASE_URL}/contacts`, data);
        set(state => {
          state.contacts.push(response.data);
          state.loading = false;
        });
      } catch (err) {
        set(state => {
          state.error = err instanceof Error ? err.message : 'Failed to create contact';
          state.loading = false;
        });
      }
    },

    logActivity: async (data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.post<Activity>(`${BASE_URL}/activities`, data);
        set(state => {
          state.activities.push(response.data);
          state.loading = false;
        });
      } catch (err) {
        set(state => {
          state.error = err instanceof Error ? err.message : 'Failed to log activity';
          state.loading = false;
        });
      }
    },
  }))
);
```

Key features:
- Full TypeScript typing
- Immer middleware for immutable state updates
- Comprehensive error handling
- Axios for API calls
- Separate interfaces for Customer, Contact, and Activity
- Loading and error state management
- CRUD operations for customers, contacts, and activities
- Typed actions with proper error catching
