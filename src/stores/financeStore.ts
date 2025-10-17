Here's a comprehensive, production-ready Zustand store for finance functionality:

```typescript
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import axios from 'axios';

// Type Definitions
export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: 'credit_card' | 'bank_transfer' | 'cash';
}

export interface FinanceDashboard {
  totalRevenue: number;
  outstandingInvoices: number;
  recentPayments: Payment[];
}

// Store Interface
interface FinanceState {
  invoices: Invoice[];
  quotes: Quote[];
  payments: Payment[];
  dashboard: FinanceDashboard | null;
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (data: Partial<Invoice>) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  sendInvoice: (id: string) => Promise<void>;
  fetchQuotes: () => Promise<void>;
  createQuote: (data: Partial<Quote>) => Promise<void>;
  recordPayment: (data: Partial<Payment>) => Promise<void>;
  fetchDashboard: () => Promise<void>;
}

// Base API URL
const API_BASE_URL = 'http://localhost:8000/api/finance';

// Zustand Store
export const useFinanceStore = create<FinanceState>()(
  immer((set, get) => ({
    invoices: [],
    quotes: [],
    payments: [],
    dashboard: null,
    loading: false,
    error: null,

    fetchInvoices: async () => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.get<Invoice[]>(`${API_BASE_URL}/invoices`);
        set(state => { 
          state.invoices = response.data;
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to fetch invoices';
          state.loading = false;
        });
      }
    },

    createInvoice: async (data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.post<Invoice>(`${API_BASE_URL}/invoices`, data);
        set(state => { 
          state.invoices.push(response.data);
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to create invoice';
          state.loading = false;
        });
      }
    },

    updateInvoice: async (id, data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.patch<Invoice>(`${API_BASE_URL}/invoices/${id}`, data);
        set(state => { 
          const index = state.invoices.findIndex(inv => inv.id === id);
          if (index !== -1) state.invoices[index] = response.data;
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to update invoice';
          state.loading = false;
        });
      }
    },

    sendInvoice: async (id) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        await axios.post(`${API_BASE_URL}/invoices/${id}/send`);
        set(state => { 
          const index = state.invoices.findIndex(inv => inv.id === id);
          if (index !== -1) state.invoices[index].status = 'sent';
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to send invoice';
          state.loading = false;
        });
      }
    },

    fetchQuotes: async () => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.get<Quote[]>(`${API_BASE_URL}/quotes`);
        set(state => { 
          state.quotes = response.data;
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to fetch quotes';
          state.loading = false;
        });
      }
    },

    createQuote: async (data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.post<Quote>(`${API_BASE_URL}/quotes`, data);
        set(state => { 
          state.quotes.push(response.data);
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to create quote';
          state.loading = false;
        });
      }
    },

    recordPayment: async (data) => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.post<Payment>(`${API_BASE_URL}/payments`, data);
        set(state => { 
          state.payments.push(response.data);
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to record payment';
          state.loading = false;
        });
      }
    },

    fetchDashboard: async () => {
      set(state => { state.loading = true; state.error = null; });
      try {
        const response = await axios.get<FinanceDashboard>(`${API_BASE_URL}/dashboard`);
        set(state => { 
          state.dashboard = response.data;
          state.loading = false;
        });
      } catch (error) {
        set(state => { 
          state.error = error instanceof Error ? error.message : 'Failed to fetch dashboard';
          state.loading = false;
        });
      }
    },
  }))
);
```

This implementation provides:
- Comprehensive TypeScript types
- Immer middleware for immutable state updates
- Error handling for all API calls
- Loading state management
- Type-safe actions for finance-related operations
- Axios for API interactions
- Flexible state management for invoices, quotes, payments, and dashboard
