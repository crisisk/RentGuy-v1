import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import axios from 'axios';
const API_BASE = 'http://localhost:8000/api/v1/finance';
interface FinanceState {
  invoices: any[];
  quotes: any[];
  payments: any[];
  stats: any | null;
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (invoiceData: any) => Promise<void>;
  updateInvoice: (id: string, invoiceData: any) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  fetchQuotes: () => Promise<void>;
  createQuote: (quoteData: any) => Promise<void>;
  convertQuoteToInvoice: (quoteId: string) => Promise<void>;
  fetchPayments: () => Promise<void>;
  recordPayment: (paymentData: any) => Promise<void>;
  getFinanceStats: () => Promise<void>;
}
export const financeStore = create<FinanceState>()(immer((set) => ({
  invoices: [],
  quotes: [],
  payments: [],
  stats: null,
  loading: false,
  error: null,
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/invoices`);
      set({ invoices: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch invoices', loading: false });
    }
  },
  createInvoice: async (invoiceData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/invoices`, invoiceData);
      set((state) => { state.invoices.push(response.data); state.loading = false; });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create invoice', loading: false });
    }
  },
  updateInvoice: async (id, invoiceData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${API_BASE}/invoices/${id}`, invoiceData);
      set((state) => {
        const index = state.invoices.findIndex((inv: any) => inv.id === id);
        if (index !== -1) state.invoices[index] = response.data;
        state.loading = false;
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update invoice', loading: false });
    }
  },
  deleteInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_BASE}/invoices/${id}`);
      set((state) => { state.invoices = state.invoices.filter((inv: any) => inv.id !== id); state.loading = false; });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete invoice', loading: false });
    }
  },
  fetchQuotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/quotes`);
      set({ quotes: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch quotes', loading: false });
    }
  },
  createQuote: async (quoteData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/quotes`, quoteData);
      set((state) => { state.quotes.push(response.data); state.loading = false; });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create quote', loading: false });
    }
  },
  convertQuoteToInvoice: async (quoteId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/quotes/${quoteId}/convert`);
      set((state) => {
        state.invoices.push(response.data);
        state.quotes = state.quotes.filter((quote: any) => quote.id !== quoteId);
        state.loading = false;
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to convert quote', loading: false });
    }
  },
  fetchPayments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/payments`);
      set({ payments: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch payments', loading: false });
    }
  },
  recordPayment: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/payments`, paymentData);
      set((state) => { state.payments.push(response.data); state.loading = false; });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to record payment', loading: false });
    }
  },
  getFinanceStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      set({ stats: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch stats', loading: false });
    }
  },
})));
export default financeStore;
