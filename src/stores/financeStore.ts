import axios from 'axios'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const API_BASE = 'http://localhost:8000/api/v1/finance'

export type InvoiceStatus = 'pending' | 'paid' | 'overdue'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceRecord {
  id: string
  clientName: string
  amount: number
  status: InvoiceStatus
  invoiceDate: Date
  dueDate: Date
  lineItems: InvoiceLineItem[]
}

export interface FinanceStats {
  monthlyRevenue: number
  pendingInvoicesTotal: number
  paidInvoicesTotal: number
}

export interface QuoteRecord {
  id: string
  number: string
  client: string
  amount: number
  date: Date
  status: 'draft' | 'sent' | 'converted'
  invoiceId?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  date: Date
  method?: string
  reference?: string
  status?: string
}

export interface InvoicePayload {
  clientName: string
  invoiceDate: Date | string
  dueDate: Date | string
  lineItems?: InvoiceLineItem[]
  total?: number
  status?: InvoiceStatus
  [key: string]: unknown
}

export interface QuotePayload {
  number: string
  client: string
  amount: number
  date: Date | string
  status?: 'draft' | 'sent' | 'converted'
  [key: string]: unknown
}

export interface PaymentPayload {
  amount: number
  date: Date | string
  method?: string
  reference?: string
  status?: string
  [key: string]: unknown
}

interface FinanceState {
  invoices: InvoiceRecord[]
  quotes: QuoteRecord[]
  payments: PaymentRecord[]
  stats: FinanceStats | null
  loading: boolean
  error: string | null
  getInvoices: (forceRefresh?: boolean) => Promise<InvoiceRecord[]>
  getInvoiceById: (id: string) => Promise<InvoiceRecord>
  createInvoice: (invoiceData: InvoicePayload) => Promise<InvoiceRecord>
  updateInvoice: (id: string, invoiceData: Partial<InvoicePayload>) => Promise<InvoiceRecord>
  deleteInvoice: (id: string) => Promise<void>
  getQuotes: (forceRefresh?: boolean) => Promise<QuoteRecord[]>
  createQuote: (quoteData: QuotePayload) => Promise<QuoteRecord>
  convertQuoteToInvoice: (quoteId: string) => Promise<string>
  getPayments: (forceRefresh?: boolean) => Promise<PaymentRecord[]>
  recordPayment: (paymentData: PaymentPayload) => Promise<PaymentRecord>
  getFinanceStats: () => Promise<FinanceStats>
  getDashboardData: () => Promise<{ invoices: InvoiceRecord[]; stats: FinanceStats }>
}

const defaultStats: FinanceStats = {
  monthlyRevenue: 0,
  pendingInvoicesTotal: 0,
  paidInvoicesTotal: 0,
}

function generateId(): string {
  const cryptoApi = typeof globalThis !== 'undefined' && 'crypto' in globalThis ? (globalThis.crypto as Crypto | undefined) : undefined
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11)
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date()
}

function normaliseInvoice(raw: any, fallbackId?: string): InvoiceRecord {
  const lineItems = normaliseLineItems(raw)
  const lineTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const amount = Number(raw?.amount ?? raw?.total ?? lineTotal ?? 0)
  const rawStatus = String(raw?.status ?? '').toLowerCase()
  const status: InvoiceStatus = rawStatus === 'paid' || rawStatus === 'overdue' ? (rawStatus as InvoiceStatus) : 'pending'

  return {
    id: String(raw?.id ?? raw?.invoiceId ?? raw?.invoice_id ?? fallbackId ?? generateId()),
    clientName: String(raw?.clientName ?? raw?.client ?? raw?.client_name ?? 'Unknown client'),
    amount: Number.isFinite(amount) ? amount : 0,
    status,
    invoiceDate: toDate(raw?.invoiceDate ?? raw?.invoice_date ?? raw?.date ?? raw?.createdAt),
    dueDate: toDate(raw?.dueDate ?? raw?.due_date ?? raw?.paymentDue),
    lineItems,
  }
}

function normaliseLineItems(raw: any): InvoiceLineItem[] {
  const collection = Array.isArray(raw?.lineItems)
    ? raw?.lineItems
    : Array.isArray(raw?.line_items)
      ? raw?.line_items
      : []

  return collection.map((item: any, index: number) => ({
    id: String(item?.id ?? item?.lineItemId ?? item?.line_item_id ?? index),
    description: String(item?.description ?? item?.name ?? ''),
    quantity: Number(item?.quantity ?? 0),
    unitPrice: Number(item?.unitPrice ?? item?.unit_price ?? item?.price ?? 0),
  }))
}

function normaliseQuote(raw: any): QuoteRecord {
  const rawStatus = String(raw?.status ?? '').toLowerCase()
  const status: QuoteRecord['status'] = rawStatus === 'sent' || rawStatus === 'converted' ? (rawStatus as QuoteRecord['status']) : 'draft'

  return {
    id: String(raw?.id ?? raw?.quoteId ?? raw?.quote_id ?? generateId()),
    number: String(raw?.number ?? raw?.quoteNumber ?? raw?.reference ?? '—'),
    client: String(raw?.client ?? raw?.clientName ?? raw?.customer ?? 'Unknown client'),
    amount: Number(raw?.amount ?? raw?.total ?? 0),
    date: toDate(raw?.date ?? raw?.createdAt ?? raw?.issued_at),
    status,
    invoiceId: raw?.invoiceId ?? raw?.invoice_id ? String(raw?.invoiceId ?? raw?.invoice_id) : undefined,
  }
}

function normalisePayment(raw: any): PaymentRecord {
  return {
    id: String(raw?.id ?? raw?.paymentId ?? raw?.payment_id ?? generateId()),
    amount: Number(raw?.amount ?? raw?.total ?? 0),
    date: toDate(raw?.date ?? raw?.createdAt ?? raw?.processed_at),
    method: raw?.method ?? raw?.paymentMethod ?? raw?.payment_method,
    reference: raw?.reference ?? raw?.externalReference ?? raw?.external_reference,
    status: raw?.status,
  }
}

function normaliseStats(raw: any): FinanceStats {
  if (!raw) {
    return { ...defaultStats }
  }

  return {
    monthlyRevenue: Number(raw?.monthlyRevenue ?? raw?.monthly_revenue ?? raw?.revenue ?? 0),
    pendingInvoicesTotal: Number(raw?.pendingInvoicesTotal ?? raw?.pending_invoices_total ?? raw?.pending ?? 0),
    paidInvoicesTotal: Number(raw?.paidInvoicesTotal ?? raw?.paid_invoices_total ?? raw?.paid ?? 0),
  }
}

function computeStatsFromInvoices(invoices: InvoiceRecord[]): FinanceStats {
  if (invoices.length === 0) {
    return { ...defaultStats }
  }

  const pendingInvoicesTotal = invoices
    .filter(invoice => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  const paidInvoicesTotal = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  const monthlyRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)

  return {
    monthlyRevenue,
    pendingInvoicesTotal,
    paidInvoicesTotal,
  }
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return String(error.response?.data?.message ?? error.message ?? fallback)
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

function serialiseInvoicePayload(payload: InvoicePayload): Record<string, unknown> {
  const invoiceDate = toDate(payload.invoiceDate).toISOString()
  const dueDate = toDate(payload.dueDate).toISOString()

  return {
    ...payload,
    invoiceDate,
    dueDate,
  }
}

const financeStoreBase = create<FinanceState>()(
  immer((set, get) => ({
    invoices: [],
    quotes: [],
    payments: [],
    stats: null,
    loading: false,
    error: null,

    async getInvoices(forceRefresh = false) {
      if (!forceRefresh && get().invoices.length > 0) {
        return get().invoices
      }

      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await axios.get(`${API_BASE}/invoices`)
        const invoices = Array.isArray(response.data) ? response.data.map(normaliseInvoice) : []

        set(state => {
          state.invoices = invoices
          state.loading = false
        })

        return invoices
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to fetch invoices')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getInvoiceById(id) {
      const existing = get().invoices.find(invoice => invoice.id === id)
      if (existing) {
        return existing
      }

      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await axios.get(`${API_BASE}/invoices/${id}`)
        const invoice = normaliseInvoice(response.data, id)

        set(state => {
          const index = state.invoices.findIndex(item => item.id === invoice.id)
          if (index === -1) {
            state.invoices.push(invoice)
          } else {
            state.invoices[index] = invoice
          }
          state.loading = false
        })

        return invoice
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to load invoice')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async createInvoice(invoiceData) {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = serialiseInvoicePayload(invoiceData)
        const response = await axios.post(`${API_BASE}/invoices`, payload)
        const invoice = normaliseInvoice(response.data)

        set(state => {
          state.invoices.push(invoice)
          state.loading = false
        })

        return invoice
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to create invoice')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async updateInvoice(id, invoiceData) {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const existing = get().invoices.find(item => item.id === id)
        const payload = serialiseInvoicePayload({
          ...existing,
          ...invoiceData,
          clientName: invoiceData.clientName ?? existing?.clientName ?? '',
          invoiceDate: invoiceData.invoiceDate ?? existing?.invoiceDate ?? new Date(),
          dueDate: invoiceData.dueDate ?? existing?.dueDate ?? new Date(),
          lineItems: invoiceData.lineItems ?? existing?.lineItems ?? [],
          total: invoiceData.total ?? existing?.amount ?? 0,
          status: invoiceData.status ?? existing?.status ?? 'pending',
        })

        const response = await axios.put(`${API_BASE}/invoices/${id}`, payload)
        const invoice = normaliseInvoice(response.data, id)

        set(state => {
          const index = state.invoices.findIndex(item => item.id === id)
          if (index !== -1) {
            state.invoices[index] = invoice
          } else {
            state.invoices.push(invoice)
          }
          state.loading = false
        })

        return invoice
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to update invoice')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async deleteInvoice(id) {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        await axios.delete(`${API_BASE}/invoices/${id}`)
        set(state => {
          state.invoices = state.invoices.filter(invoice => invoice.id !== id)
          state.loading = false
        })
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to delete invoice')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getQuotes(forceRefresh = false) {
      if (!forceRefresh && get().quotes.length > 0) {
        return get().quotes
      }

      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await axios.get(`${API_BASE}/quotes`)
        const quotes = Array.isArray(response.data) ? response.data.map(normaliseQuote) : []

        set(state => {
          state.quotes = quotes
          state.loading = false
        })

        return quotes
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to fetch quotes')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async createQuote(quoteData) {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = {
          ...quoteData,
          date: toDate(quoteData.date).toISOString(),
        }

        const response = await axios.post(`${API_BASE}/quotes`, payload)
        const quote = normaliseQuote(response.data)

        set(state => {
          state.quotes.push(quote)
          state.loading = false
        })

        return quote
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to create quote')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async convertQuoteToInvoice(quoteId) {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await axios.post(`${API_BASE}/quotes/${quoteId}/convert`)
        const invoiceData = response.data?.invoice ?? response.data
        const invoice = normaliseInvoice(invoiceData, quoteId)

        set(state => {
          const quoteIndex = state.quotes.findIndex(quote => quote.id === quoteId)
          if (quoteIndex !== -1) {
            state.quotes[quoteIndex].status = 'converted'
            state.quotes[quoteIndex].invoiceId = invoice.id
          }
          const invoiceIndex = state.invoices.findIndex(item => item.id === invoice.id)
          if (invoiceIndex !== -1) {
            state.invoices[invoiceIndex] = invoice
          } else {
            state.invoices.push(invoice)
          }
          state.loading = false
        })

        return invoice.id
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to convert quote to invoice')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getPayments(forceRefresh = false) {
      if (!forceRefresh && get().payments.length > 0) {
        return get().payments
      }

      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await axios.get(`${API_BASE}/payments`)
        const payments = Array.isArray(response.data) ? response.data.map(normalisePayment) : []

        set(state => {
          state.payments = payments
          state.loading = false
        })

        return payments
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to fetch payments')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async recordPayment(paymentData) {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = {
          ...paymentData,
          date: toDate(paymentData.date).toISOString(),
        }

        const response = await axios.post(`${API_BASE}/payments`, payload)
        const payment = normalisePayment(response.data)

        set(state => {
          state.payments.push(payment)
          state.loading = false
        })

        return payment
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to record payment')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getFinanceStats() {
      set(state => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await axios.get(`${API_BASE}/stats`)
        const stats = normaliseStats(response.data)

        set(state => {
          state.stats = stats
          state.loading = false
        })

        return stats
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to fetch finance stats')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getDashboardData() {
      try {
        const invoices = await get().getInvoices()
        try {
          const stats = await get().getFinanceStats()
          return { invoices, stats }
        } catch {
          const fallbackStats = computeStatsFromInvoices(invoices)
          return { invoices, stats: fallbackStats }
        }
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to load finance dashboard data')
        set(state => {
          state.error = message
        })
        throw new Error(message)
      }
    },
  })),
)

type FinanceStore = typeof financeStoreBase & {
  getInvoices: (forceRefresh?: boolean) => Promise<InvoiceRecord[]>
  getInvoiceById: (id: string) => Promise<InvoiceRecord>
  createInvoice: (invoiceData: InvoicePayload) => Promise<InvoiceRecord>
  updateInvoice: (id: string, invoiceData: Partial<InvoicePayload>) => Promise<InvoiceRecord>
  deleteInvoice: (id: string) => Promise<void>
  getQuotes: (forceRefresh?: boolean) => Promise<QuoteRecord[]>
  createQuote: (quoteData: QuotePayload) => Promise<QuoteRecord>
  convertQuoteToInvoice: (quoteId: string) => Promise<string>
  getPayments: (forceRefresh?: boolean) => Promise<PaymentRecord[]>
  recordPayment: (paymentData: PaymentPayload) => Promise<PaymentRecord>
  getFinanceStats: () => Promise<FinanceStats>
  getDashboardData: () => Promise<{ invoices: InvoiceRecord[]; stats: FinanceStats }>
}

const financeStore = Object.assign(financeStoreBase, {
  getInvoices: (forceRefresh?: boolean) => financeStoreBase.getState().getInvoices(forceRefresh),
  getInvoiceById: (id: string) => financeStoreBase.getState().getInvoiceById(id),
  createInvoice: (invoiceData: InvoicePayload) => financeStoreBase.getState().createInvoice(invoiceData),
  updateInvoice: (id: string, invoiceData: Partial<InvoicePayload>) =>
    financeStoreBase.getState().updateInvoice(id, invoiceData),
  deleteInvoice: (id: string) => financeStoreBase.getState().deleteInvoice(id),
  getQuotes: (forceRefresh?: boolean) => financeStoreBase.getState().getQuotes(forceRefresh),
  createQuote: (quoteData: QuotePayload) => financeStoreBase.getState().createQuote(quoteData),
  convertQuoteToInvoice: (quoteId: string) => financeStoreBase.getState().convertQuoteToInvoice(quoteId),
  getPayments: (forceRefresh?: boolean) => financeStoreBase.getState().getPayments(forceRefresh),
  recordPayment: (paymentData: PaymentPayload) => financeStoreBase.getState().recordPayment(paymentData),
  getFinanceStats: () => financeStoreBase.getState().getFinanceStats(),
  getDashboardData: () => financeStoreBase.getState().getDashboardData(),
}) as FinanceStore

export type { FinanceStore }
export const useFinanceStore = financeStoreBase
export default financeStore
