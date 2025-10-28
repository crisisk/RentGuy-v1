import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'draft' | string

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  clientName: string
  amount: number
  date: string
  dueDate?: string
  status: InvoiceStatus
  description?: string
  lineItems: InvoiceLineItem[]
}

export interface Quote {
  id: string
  number: string
  client: string
  amount: number
  date: string
  status: 'draft' | 'sent' | 'converted' | string
  converted: boolean
}

export interface Payment {
  id: string
  amount: number
  invoiceId: string
  method: string
  processedAt?: string
}

export interface FinanceStats {
  monthlyRevenue: number
  pendingInvoicesTotal: number
  paidInvoicesTotal: number
}

export interface InvoiceInput {
  clientName: string
  invoiceDate: string | Date
  dueDate?: string | Date
  lineItems: InvoiceLineItem[]
  total?: number
  description?: string
}

interface FinanceState {
  invoices: Invoice[]
  quotes: Quote[]
  payments: Payment[]
  stats: FinanceStats | null
  loading: boolean
  error: string | null
  fetchInvoices: () => Promise<Invoice[]>
  getInvoiceById: (id: string) => Promise<Invoice | null>
  createInvoice: (invoice: InvoiceInput) => Promise<Invoice>
  updateInvoice: (id: string, invoice: InvoiceInput) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
  fetchQuotes: () => Promise<Quote[]>
  getQuotes: () => Promise<Quote[]>
  convertQuoteToInvoice: (quoteId: string) => Promise<string>
  fetchPayments: () => Promise<Payment[]>
  recordPayment: (payment: Omit<Payment, 'id' | 'processedAt'>) => Promise<Payment>
  getFinanceStats: () => Promise<FinanceStats>
  getDashboardData: () => Promise<{ invoices: Invoice[]; stats: FinanceStats | null }>
  clearError: () => void
}

const FINANCE_BASE = '/api/v1/finance'

const generateId = () => Math.random().toString(36).slice(2, 11)

const ensureLineItems = (items: InvoiceLineItem[] = []): InvoiceLineItem[] =>
  items.map((item) => ({
    id: item.id || generateId(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))

function resolveError(error: unknown, fallback: string): string {
  const mapped = mapUnknownToApiError(error)
  return mapped.message || fallback
}

const mapInvoiceResponse = (payload: any): Invoice => {
  const invoice: Invoice = {
    id: String(payload.id ?? payload.invoice_id ?? generateId()),
    clientName: payload.clientName ?? payload.client ?? payload.client_name ?? 'Unknown client',
    amount: Number(
      payload.amount ?? payload.total_gross ?? payload.total_net ?? payload.total ?? 0,
    ),
    date: new Date(payload.date ?? payload.issued_at ?? Date.now()).toISOString(),
    status: (payload.status ?? (payload.converted ? 'converted' : 'pending')) as InvoiceStatus,
    lineItems: ensureLineItems(payload.lineItems ?? payload.line_items ?? []),
  }

  const dueCandidate = payload.dueDate ?? payload.due_at
  if (dueCandidate) {
    invoice.dueDate = new Date(dueCandidate).toISOString()
  }

  const descriptionCandidate = payload.description ?? payload.reference
  if (descriptionCandidate) {
    invoice.description = String(descriptionCandidate)
  }

  return invoice
}

const mapQuoteResponse = (payload: any): Quote => {
  const id = String(payload.id ?? generateId())
  const status: Quote['status'] = (
    typeof payload.status === 'string' && payload.status.length
      ? payload.status
      : payload.converted
        ? 'converted'
        : 'draft'
  ) as Quote['status']

  return {
    id,
    number:
      payload.number ??
      (payload.reference ? String(payload.reference) : `Q-${id.slice(-6).toUpperCase()}`),
    client: payload.client ?? payload.clientName ?? payload.client_name ?? 'Unknown client',
    amount: Number(payload.amount ?? payload.total ?? 0),
    date: new Date(payload.date ?? payload.valid_until ?? Date.now()).toISOString(),
    status,
    converted: Boolean(payload.converted ?? status === 'converted'),
  }
}

const mapPaymentResponse = (payload: any): Payment => {
  const payment: Payment = {
    id: String(payload.id ?? generateId()),
    amount: Number(payload.amount ?? 0),
    invoiceId: String(payload.invoice_id ?? payload.invoiceId ?? ''),
    method: payload.method ?? payload.provider ?? 'unknown',
  }

  const processedCandidate = payload.processed_at ?? payload.created_at
  if (processedCandidate) {
    payment.processedAt = new Date(processedCandidate).toISOString()
  }

  return payment
}

const deriveStatsFromInvoices = (invoices: Invoice[]): FinanceStats => {
  const pendingInvoicesTotal = invoices
    .filter((invoice) => invoice.status === 'pending')
    .reduce((total, invoice) => total + invoice.amount, 0)

  const paidInvoicesTotal = invoices
    .filter((invoice) => invoice.status === 'paid' || invoice.status === 'completed')
    .reduce((total, invoice) => total + invoice.amount, 0)

  const monthlyRevenue = paidInvoicesTotal

  return {
    monthlyRevenue,
    pendingInvoicesTotal,
    paidInvoicesTotal,
  }
}

const toInvoiceRequest = (invoice: InvoiceInput) => {
  const totalFromItems = invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )
  const total = invoice.total ?? totalFromItems
  return {
    amount: total,
    client: invoice.clientName,
    date: new Date(invoice.invoiceDate).toISOString(),
    description:
      invoice.description ||
      (invoice.lineItems.length
        ? invoice.lineItems.map((item) => `${item.quantity}x ${item.description}`).join(', ')
        : undefined),
  }
}

export const useFinanceStore = create<FinanceState>()(
  immer((set, get) => ({
    invoices: [],
    quotes: [],
    payments: [],
    stats: null,
    loading: false,
    error: null,

    clearError: () => {
      set({ error: null })
    },

    fetchInvoices: async () => {
      set({ loading: true, error: null })
      try {
        const response = await api.get(`${FINANCE_BASE}/invoices`)
        const invoices = (Array.isArray(response.data) ? response.data : []).map(mapInvoiceResponse)
        set({ invoices, loading: false })
        return invoices
      } catch (error) {
        const message = resolveError(error, 'Failed to fetch invoices')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    getInvoiceById: async (id: string) => {
      const existing = get().invoices.find((invoice) => invoice.id === id)
      if (existing) {
        return existing
      }

      set({ loading: true, error: null })
      try {
        const response = await api.get(`${FINANCE_BASE}/invoices/${id}`)
        const invoice = mapInvoiceResponse(response.data)
        set((state) => {
          state.invoices.push(invoice)
          state.loading = false
        })
        return invoice
      } catch (error: any) {
        if (error?.response?.status === 404) {
          try {
            const invoices = await get().fetchInvoices()
            return invoices.find((invoice) => invoice.id === id) ?? null
          } finally {
            set((state) => {
              state.loading = false
            })
          }
        }

        const message = resolveError(error, 'Failed to load invoice')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    createInvoice: async (invoice) => {
      set({ loading: true, error: null })
      try {
        const payload = toInvoiceRequest(invoice)
        const response = await api.post(`${FINANCE_BASE}/invoices`, payload)
        const created = mapInvoiceResponse(response.data)
        created.lineItems = ensureLineItems(invoice.lineItems)
        set((state) => {
          state.invoices.push(created)
          state.loading = false
        })
        return created
      } catch (error) {
        const message = resolveError(error, 'Failed to create invoice')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    updateInvoice: async (id, invoice) => {
      set({ loading: true, error: null })
      try {
        const payload = toInvoiceRequest(invoice)
        const response = await api.put(`${FINANCE_BASE}/invoices/${id}`, payload)
        const updated = mapInvoiceResponse(response.data)
        updated.lineItems = ensureLineItems(invoice.lineItems)
        set((state) => {
          const index = state.invoices.findIndex((item) => item.id === id)
          if (index >= 0) {
            state.invoices[index] = updated
          } else {
            state.invoices.push(updated)
          }
          state.loading = false
        })
        return updated
      } catch (error) {
        const message = resolveError(error, 'Failed to update invoice')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    deleteInvoice: async (id) => {
      set({ loading: true, error: null })
      try {
        await api.delete(`${FINANCE_BASE}/invoices/${id}`)
        set((state) => {
          state.invoices = state.invoices.filter((invoice) => invoice.id !== id)
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error, 'Failed to delete invoice')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    fetchQuotes: async () => {
      set({ loading: true, error: null })
      try {
        const response = await api.get(`${FINANCE_BASE}/quotes`)
        const quotes = (Array.isArray(response.data) ? response.data : []).map(mapQuoteResponse)
        set({ quotes, loading: false })
        return quotes
      } catch (error) {
        const message = resolveError(error, 'Failed to fetch quotes')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    getQuotes: async () => {
      const quotes = await get().fetchQuotes()
      return quotes
    },

    convertQuoteToInvoice: async (quoteId) => {
      set({ loading: true, error: null })
      try {
        const response = await api.post(`${FINANCE_BASE}/quotes/${quoteId}/convert`)
        const invoice = mapInvoiceResponse(response.data)
        set((state) => {
          state.invoices.push(invoice)
          state.quotes = state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, status: 'converted', converted: true } : quote,
          )
          state.loading = false
        })
        return invoice.id
      } catch (error) {
        const message = resolveError(error, 'Failed to convert quote')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    fetchPayments: async () => {
      set({ loading: true, error: null })
      try {
        const response = await api.get(`${FINANCE_BASE}/payments`)
        const payments = (Array.isArray(response.data) ? response.data : []).map(mapPaymentResponse)
        set({ payments, loading: false })
        return payments
      } catch (error) {
        const message = resolveError(error, 'Failed to fetch payments')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    recordPayment: async (payment) => {
      set({ loading: true, error: null })
      try {
        const response = await api.post(`${FINANCE_BASE}/payments`, {
          amount: payment.amount,
          invoice_id: payment.invoiceId,
          method: payment.method,
        })
        const created = mapPaymentResponse(response.data)
        set((state) => {
          state.payments.push(created)
          state.loading = false
        })
        return created
      } catch (error) {
        const message = resolveError(error, 'Failed to record payment')
        set({ error: message, loading: false })
        throw new Error(message)
      }
    },

    getFinanceStats: async () => {
      set({ loading: true, error: null })
      try {
        const response = await api.get(`${FINANCE_BASE}/stats`)
        const invoices = get().invoices
        const stats = deriveStatsFromInvoices(invoices)
        const revenue = Number(response.data?.revenue ?? stats.monthlyRevenue)
        const enrichedStats: FinanceStats = {
          monthlyRevenue: revenue,
          pendingInvoicesTotal: stats.pendingInvoicesTotal,
          paidInvoicesTotal: stats.paidInvoicesTotal,
        }
        set({ stats: enrichedStats, loading: false })
        return enrichedStats
      } catch (error) {
        const message = resolveError(error, 'Failed to load finance stats')
        set({ error: message, loading: false })
        const invoices = get().invoices
        const stats = deriveStatsFromInvoices(invoices)
        set({ stats, loading: false })
        return stats
      }
    },

    getDashboardData: async () => {
      set({ loading: true, error: null })
      try {
        const invoices = await get().fetchInvoices()
        const stats = await get().getFinanceStats()
        set({ loading: false })
        return { invoices, stats }
      } catch {
        const invoices = get().invoices
        const stats = deriveStatsFromInvoices(invoices)
        set({ stats, loading: false })
        return { invoices, stats }
      }
    },
  })),
)

export default useFinanceStore
