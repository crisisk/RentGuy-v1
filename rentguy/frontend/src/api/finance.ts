import apiClient from './client';
import { Invoice, Quote, FinancialMetrics } from '../types';

// Mock data for initial integration
const mockInvoices: Invoice[] = [
    { id: 'i1', customerId: 'c1', amount: 15000, status: 'pending', dueDate: '2025-11-01' },
    { id: 'i2', customerId: 'c2', amount: 5000, status: 'paid', dueDate: '2025-09-15' },
    { id: 'i3', customerId: 'c1', amount: 2500, status: 'overdue', dueDate: '2025-08-01' },
];

const mockQuotes: Quote[] = [
    { id: 'q1', customerId: 'c3', amount: 12000, status: 'sent' },
    { id: 'q2', customerId: 'c4', amount: 8000, status: 'accepted' },
];

const mockMetrics: FinancialMetrics = {
    totalRevenue: 150000,
    outstandingInvoices: 45000,
    profitMargin: 0.35,
    period: 'month',
};

export const getMetrics = financeAPI.getMetrics;
export const getInvoices = financeAPI.getInvoices;
export const createInvoice = financeAPI.createInvoice;
export const markAsPaid = financeAPI.markAsPaid;
export const sendReminder = financeAPI.sendReminder;
export const exportToExactOnline = financeAPI.exportToExactOnline;
export const getQuotes = financeAPI.getQuotes;
export const createQuote = financeAPI.createQuote;
export const convertToInvoice = financeAPI.convertToInvoice;

export const getPayments = financeAPI.getPayments;

export const financeAPI = {
  // Dashboard Metrics
  getMetrics: async (period: 'month' | 'quarter' | 'year'): Promise<FinancialMetrics> => {
    // const response = await apiClient.get('/finance/metrics', { params: { period } });
    // return response.data;
    return { ...mockMetrics, period };
  },

  // Invoices
  getInvoices: async (filters?: {
    status?: 'paid' | 'pending' | 'overdue' | 'sent';
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Invoice[]> => {
    // const response = await apiClient.get('/invoices', { params: filters });
    // return response.data;
    let filteredInvoices = mockInvoices;
    if (filters?.status) {
        filteredInvoices = filteredInvoices.filter(i => i.status === filters.status);
    }
    return filteredInvoices;
  },

  createInvoice: async (invoice: Partial<Invoice>): Promise<Invoice> => {
    // const response = await apiClient.post('/invoices', invoice);
    // return response.data;
    const newInvoice: Invoice = { ...invoice as Invoice, id: `i${mockInvoices.length + 1}`, status: 'sent', amount: invoice.amount || 0, customerId: invoice.customerId || 'c_unknown', dueDate: invoice.dueDate || new Date().toISOString() };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  markAsPaid: async (invoiceId: string): Promise<void> => {
    // await apiClient.post(`/invoices/${invoiceId}/mark-paid`);
    const invoice = mockInvoices.find(i => i.id === invoiceId);
    if (invoice) invoice.status = 'paid';
  },

  sendReminder: async (invoiceId: string): Promise<void> => {
    // await apiClient.post(`/invoices/${invoiceId}/send-reminder`);
    console.log(`Mock: Sent reminder for invoice ${invoiceId}`);
  },

  exportToExactOnline: async (invoiceIds: string[]): Promise<void> => {
    // await apiClient.post('/invoices/export/exact-online', { invoiceIds });
    console.log(`Mock: Exported invoices ${invoiceIds.join(', ')} to Exact Online`);
  },

  // Quotes
  getQuotes: async (filters?: {
    status?: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  }): Promise<Quote[]> => {
    // const response = await apiClient.get('/quotes', { params: filters });
    // return response.data;
    let filteredQuotes = mockQuotes;
    if (filters?.status) {
        filteredQuotes = filteredQuotes.filter(q => q.status === filters.status);
    }
    return filteredQuotes;
  },

  createQuote: async (quote: Partial<Quote>): Promise<Quote> => {
    // const response = await apiClient.post('/quotes', quote);
    // return response.data;
    const newQuote: Quote = { ...quote as Quote, id: `q${mockQuotes.length + 1}`, status: 'sent', amount: quote.amount || 0, customerId: quote.customerId || 'c_unknown' };
    mockQuotes.push(newQuote);
    return newQuote;
  },

  convertToInvoice: async (quoteId: string): Promise<Invoice> => {
    // const response = await apiClient.post(`/quotes/${quoteId}/convert-to-invoice`);
    // return response.data;
    const quote = mockQuotes.find(q => q.id === quoteId);
    if (!quote) throw new Error('Quote not found');
    
    const newInvoice: Invoice = { id: `i${mockInvoices.length + 1}`, customerId: quote.customerId, amount: quote.amount, status: 'pending', dueDate: new Date().toISOString() };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },
};

