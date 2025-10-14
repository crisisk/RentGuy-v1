import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Invoice, Payment } from '../types';
import * as financeApi from '../api/finance';

interface FinanceState {
  invoices: Invoice[];
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  fetchPayments: () => Promise<void>;
}

export const createFinanceStore = create<FinanceState>()(immer((set) => ({
  invoices: [],
  payments: [],
  isLoading: false,
  error: null,
  fetchInvoices: async () => {
    try {
      set({ isLoading: true });
      const invoices = await financeApi.getInvoices();
      set({ invoices, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchPayments: async () => {
    try {
      set({ isLoading: true });
      const payments = await financeApi.getPayments();
      set({ payments, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

