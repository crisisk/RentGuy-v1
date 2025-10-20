import axios from 'axios'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { env } from '@config/env'
import type {
  DashboardData,
  FinanceStats,
  InvoiceDetails,
  InvoiceDraft,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceSummary,
  Payment,
  Quote,
  QuoteStatus,
} from '@rg-types/financeTypes'

const API_BASE = `${env.apiUrl}/api/v1/finance`

type InvoiceLike = {
  id: string
  clientName?: string
  customerName?: string
  customer?: { name?: string }
  amount?: number
  total?: number
  status?: string
  dueDate?: string
  due_date?: string
  invoiceDate?: string
  invoice_date?: string
  date?: string
  number?: string
  lineItems?: InvoiceLineItem[]
  items?: Array<Partial<InvoiceLineItem> & { description?: string; name?: string; qty?: number; quantity?: number; unitPrice?: number; price?: number; total?: number }>
  notes?: string
}

type QuoteLike = {
  id: string
  number?: string
  client?: string
  clientName?: string
  customerName?: string
  amount?: number
  total?: number
  date?: string
  createdAt?: string
  status?: string
}

type PaymentLike = {
  id: string
  invoiceId?: string
  invoice_id?: string
  amount?: number
  method?: string
  status?: string
  date?: string
  createdAt?: string
  reference?: string
}

interface FinanceState {
  invoices: InvoiceSummary[]
  quotes: Quote[]
  payments: Payment[]
  stats: FinanceStats | null
  loading: boolean
  error: string | null
  fetchDashboardData: () => Promise<DashboardData>
  fetchInvoices: () => Promise<InvoiceSummary[]>
  getInvoiceById: (id: string) => Promise<InvoiceDetails>
  createInvoice: (invoice: InvoiceDraft) => Promise<InvoiceDetails>
  updateInvoice: (id: string, invoice: InvoiceDraft) => Promise<InvoiceDetails>
  deleteInvoice: (id: string) => Promise<void>
  getQuotes: () => Promise<Quote[]>
  convertQuoteToInvoice: (quoteId: string) => Promise<string>
  fetchPayments: () => Promise<Payment[]>
  recordPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment>
  fetchStats: () => Promise<FinanceStats>
  resetError: () => void
}

const fallbackDate = () => new Date().toISOString()

const normaliseStatus = (status?: string): InvoiceStatus => {
  const candidate = status?.toLowerCase() as InvoiceStatus | undefined
  return candidate && ['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled'].includes(candidate)
    ? candidate
    : 'draft'
}

const normaliseInvoiceLineItem = (item: Partial<InvoiceLineItem> & { description?: string; name?: string; qty?: number; quantity?: number; unitPrice?: number; price?: number; total?: number }): InvoiceLineItem => {
  const quantity = Number(item.quantity ?? item.qty ?? 0)
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0)
  const total = Number(item.total ?? quantity * unitPrice)

  return {
    id: item.id,
    description: item.description ?? item.name ?? '',
    quantity,
    unitPrice,
    total,
  }
}

const normaliseInvoiceSummary = (invoice: InvoiceLike): InvoiceSummary => {
  const clientName = invoice.clientName ?? invoice.customerName ?? invoice.customer?.name ?? 'Unknown client'
  const amount = Number(invoice.total ?? invoice.amount ?? 0)
  const dueDate = invoice.dueDate ?? invoice.due_date ?? invoice.invoiceDate ?? invoice.invoice_date ?? fallbackDate()
  const invoiceDate = invoice.invoiceDate ?? invoice.invoice_date ?? invoice.date

  return {
    id: invoice.id,
    number: invoice.number,
    clientName,
    amount,
    status: normaliseStatus(invoice.status),
    dueDate,
    invoiceDate,
  }
}

const normaliseInvoiceDetails = (invoice: InvoiceLike): InvoiceDetails => {
  const summary = normaliseInvoiceSummary(invoice)
  const lineItemsSource = invoice.lineItems ?? invoice.items ?? []
  const lineItems = lineItemsSource.map((item) => normaliseInvoiceLineItem(item))
  const total = Number(invoice.total ?? invoice.amount ?? lineItems.reduce((sum, item) => sum + (item.total ?? 0), 0))

  return {
    ...summary,
    lineItems,
    total,
    notes: invoice.notes,
  }
}

const normaliseQuoteStatus = (status?: string): QuoteStatus => {
  const candidate = status?.toLowerCase() as QuoteStatus | undefined
  return candidate && ['draft', 'sent', 'converted'].includes(candidate) ? candidate : 'draft'
}

const normaliseQuote = (quote: QuoteLike): Quote => ({
  id: quote.id,
  number: quote.number ?? '',
  client: quote.client ?? quote.clientName ?? quote.customerName ?? 'Unknown client',
  amount: Number(quote.amount ?? quote.total ?? 0),
  date: quote.date ?? quote.createdAt ?? fallbackDate(),
  status: normaliseQuoteStatus(quote.status),
})

const normalisePayment = (payment: PaymentLike): Payment => ({
  id: payment.id,
  invoiceId: payment.invoiceId ?? payment.invoice_id ?? '',
  amount: Number(payment.amount ?? 0),
  method: (payment.method?.toLowerCase() ?? 'cash') as Payment['method'],
  status: payment.status ?? 'pending',
  date: payment.date ?? payment.createdAt ?? fallbackDate(),
  reference: payment.reference,
})

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message ?? error.message ?? 'Unable to communicate with the finance service.'
  }

  return error instanceof Error ? error.message : 'Unable to communicate with the finance service.'
}

export const useFinanceStore = create<FinanceState>()(
  immer((set) => ({
    invoices: [],
    quotes: [],
    payments: [],
    stats: null,
    loading: false,
    error: null,

    resetError: () => {
      set({ error: null })
    },

    async fetchDashboardData() {
      set({ loading: true, error: null })
      try {
        const [invoicesResponse, statsResponse] = await Promise.all([
          axios.get<InvoiceLike[]>(`${API_BASE}/invoices`, { params: { limit: 10 } }),
          axios.get<FinanceStats>(`${API_BASE}/stats`),
        ])

        const invoices = invoicesResponse.data.map((invoice) => normaliseInvoiceSummary(invoice))
        const stats = statsResponse.data

        set((state) => {
          state.invoices = invoices
          state.stats = stats
          state.loading = false
        })

        return { invoices, stats }
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async fetchInvoices() {
      set({ loading: true, error: null })
      try {
        const response = await axios.get<InvoiceLike[]>(`${API_BASE}/invoices`)
        const invoices = response.data.map((invoice) => normaliseInvoiceSummary(invoice))
        set((state) => {
          state.invoices = invoices
          state.loading = false
        })
        return invoices
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getInvoiceById(id) {
      set({ loading: true, error: null })
      try {
        const response = await axios.get<InvoiceLike>(`${API_BASE}/invoices/${id}`)
        const invoice = normaliseInvoiceDetails(response.data)
        set((state) => {
          const index = state.invoices.findIndex((existing) => existing.id === invoice.id)
          if (index >= 0) {
            state.invoices[index] = invoice
          } else {
            state.invoices.push(invoice)
          }
          state.loading = false
        })
        return invoice
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async createInvoice(invoiceDraft) {
      set({ loading: true, error: null })
      try {
        const response = await axios.post<InvoiceLike>(`${API_BASE}/invoices`, invoiceDraft)
        const invoice = normaliseInvoiceDetails(response.data)
        set((state) => {
          state.invoices.push(invoice)
          state.loading = false
        })
        return invoice
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async updateInvoice(id, invoiceDraft) {
      set({ loading: true, error: null })
      try {
        const response = await axios.put<InvoiceLike>(`${API_BASE}/invoices/${id}`, invoiceDraft)
        const invoice = normaliseInvoiceDetails(response.data)
        set((state) => {
          const index = state.invoices.findIndex((existing) => existing.id === id)
          if (index >= 0) {
            state.invoices[index] = invoice
          } else {
            state.invoices.push(invoice)
          }
          state.loading = false
        })
        return invoice
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async deleteInvoice(id) {
      set({ loading: true, error: null })
      try {
        await axios.delete(`${API_BASE}/invoices/${id}`)
        set((state) => {
          state.invoices = state.invoices.filter((invoice) => invoice.id !== id)
          state.loading = false
        })
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getQuotes() {
      set({ loading: true, error: null })
      try {
        const response = await axios.get<QuoteLike[]>(`${API_BASE}/quotes`)
        const quotes = response.data.map((quote) => normaliseQuote(quote))
        set((state) => {
          state.quotes = quotes
          state.loading = false
        })
        return quotes
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async convertQuoteToInvoice(quoteId) {
      set({ loading: true, error: null })
      try {
        const response = await axios.post<InvoiceLike>(`${API_BASE}/quotes/${quoteId}/convert`)
        const invoice = normaliseInvoiceDetails(response.data)
        set((state) => {
          state.invoices.push(invoice)
          state.quotes = state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, status: 'converted' } : quote,
          )
          state.loading = false
        })
        return invoice.id
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async fetchPayments() {
      set({ loading: true, error: null })
      try {
        const response = await axios.get<PaymentLike[]>(`${API_BASE}/payments`)
        const payments = response.data.map((payment) => normalisePayment(payment))
        set((state) => {
          state.payments = payments
          state.loading = false
        })
        return payments
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async recordPayment(paymentData) {
      set({ loading: true, error: null })
      try {
        const response = await axios.post<PaymentLike>(`${API_BASE}/payments`, paymentData)
        const payment = normalisePayment(response.data)
        set((state) => {
          state.payments.push(payment)
          const invoiceIndex = state.invoices.findIndex((invoice) => invoice.id === payment.invoiceId)
          if (invoiceIndex >= 0) {
            state.invoices[invoiceIndex].status = 'paid'
          }
          state.loading = false
        })
        return payment
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async fetchStats() {
      set({ loading: true, error: null })
      try {
        const response = await axios.get<FinanceStats>(`${API_BASE}/stats`)
        const stats = response.data
        set((state) => {
          state.stats = stats
          state.loading = false
        })
        return stats
      } catch (error) {
        const message = extractErrorMessage(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },
  })),
)

export type FinanceStore = typeof useFinanceStore
