import axios from 'axios'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type UnknownRecord = Record<string, unknown>

export type InvoiceStatus = 'paid' | 'pending' | 'overdue'

export interface InvoiceLineItem {
  readonly id: string
  readonly description: string
  readonly quantity: number
  readonly unitPrice: number
}

export interface Invoice {
  readonly id: string
  readonly clientName: string
  readonly amount: number
  readonly status: InvoiceStatus
  readonly invoiceDate: string
  readonly dueDate: string
  readonly lineItems: InvoiceLineItem[]
}

export type QuoteStatus = 'draft' | 'sent' | 'converted'

export interface Quote {
  readonly id: string
  readonly number: string
  readonly client: string
  readonly amount: number
  readonly date: string
  readonly status: QuoteStatus
}

export interface Payment {
  readonly id: string
  readonly invoiceId: string
  readonly amount: number
  readonly date: string
  readonly status: string
}

export interface FinanceStats {
  readonly monthlyRevenue: number
  readonly pendingInvoicesTotal: number
  readonly paidInvoicesTotal: number
}

export interface FinanceDashboardData {
  readonly invoices: Invoice[]
  readonly stats: FinanceStats
}

export interface InvoiceUpsertPayload {
  readonly clientName: string
  readonly invoiceDate: Date | string
  readonly dueDate: Date | string
  readonly lineItems: ReadonlyArray<Omit<InvoiceLineItem, 'id'> & { readonly id?: string }>
  readonly total: number
  readonly status?: InvoiceStatus
}

export interface QuoteUpsertPayload {
  readonly client: string
  readonly amount: number
  readonly date: Date | string
  readonly status?: QuoteStatus
  readonly number?: string
}

export interface PaymentPayload {
  readonly invoiceId: string
  readonly amount: number
  readonly date?: Date | string
  readonly status?: string
  readonly method?: string
}

interface FinanceState {
  invoices: Invoice[]
  quotes: Quote[]
  payments: Payment[]
  stats: FinanceStats | null
  loading: boolean
  error: string | null
  fetchInvoices: () => Promise<Invoice[]>
  createInvoice: (invoiceData: InvoiceUpsertPayload) => Promise<Invoice>
  updateInvoice: (id: string, invoiceData: InvoiceUpsertPayload) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
  fetchQuotes: () => Promise<Quote[]>
  createQuote: (quoteData: QuoteUpsertPayload) => Promise<Quote>
  convertQuoteToInvoice: (quoteId: string) => Promise<Invoice>
  fetchPayments: () => Promise<Payment[]>
  recordPayment: (paymentData: PaymentPayload) => Promise<Payment>
  getFinanceStats: () => Promise<FinanceStats>
  getInvoiceById: (id: string) => Promise<Invoice>
  getDashboardData: () => Promise<FinanceDashboardData>
  getQuotes: () => Promise<Quote[]>
  clearError: () => void
}

const API_BASE = 'http://localhost:8000/api/v1/finance'

function ensureString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString()
  }
  return fallback
}

function ensureNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.valueOf()
  }
  return fallback
}

function ensureIsoDate(value: unknown, fallback = new Date()): string {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString()
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString()
    }
  }
  return fallback.toISOString()
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function normaliseInvoiceStatus(value: unknown): InvoiceStatus {
  const raw = ensureString(value).toLowerCase()
  if (raw === 'paid') {
    return 'paid'
  }
  if (raw === 'overdue' || raw === 'late' || raw.includes('over')) {
    return 'overdue'
  }
  return raw === 'pending' || raw === 'unpaid' || raw.includes('pend') ? 'pending' : 'paid'
}

function normaliseQuoteStatus(value: unknown): QuoteStatus {
  const raw = ensureString(value).toLowerCase()
  if (raw === 'sent') {
    return 'sent'
  }
  if (raw === 'converted' || raw === 'accepted') {
    return 'converted'
  }
  return 'draft'
}

function normaliseLineItem(item: unknown, index: number): InvoiceLineItem {
  const record: UnknownRecord = typeof item === 'object' && item !== null ? (item as UnknownRecord) : {}
  const id = ensureString(record.id ?? record.lineItemId ?? record.itemId, generateId(`line_${index}`))
  return {
    id,
    description: ensureString(record.description ?? record.name ?? record.title, 'Onbekend artikel'),
    quantity: ensureNumber(record.quantity ?? record.qty, 1),
    unitPrice: ensureNumber(record.unitPrice ?? record.price ?? record.unit_price ?? record.amount, 0),
  }
}

function normaliseInvoice(payload: unknown): Invoice {
  const record: UnknownRecord = typeof payload === 'object' && payload !== null ? (payload as UnknownRecord) : {}
  const rawLineItems = Array.isArray(record.lineItems ?? record.items) ? (record.lineItems ?? record.items) : []
  const invoiceDate = record.invoiceDate ?? record.invoice_date ?? record.date ?? record.created_at
  const dueDate = record.dueDate ?? record.due_date ?? record.paymentDue ?? record.due ?? invoiceDate
  const amount = ensureNumber(record.amount ?? record.total ?? record.totalAmount ?? 0, 0)

  return {
    id: ensureString(record.id ?? record.invoiceId ?? record.invoice_id, generateId('inv')),
    clientName: ensureString(record.clientName ?? record.client_name ?? record.customer ?? 'Onbekende klant'),
    amount,
    status: normaliseInvoiceStatus(record.status),
    invoiceDate: ensureIsoDate(invoiceDate),
    dueDate: ensureIsoDate(dueDate, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    lineItems: rawLineItems.map((item, index) => normaliseLineItem(item, index)),
  }
}

function normaliseQuote(payload: unknown): Quote {
  const record: UnknownRecord = typeof payload === 'object' && payload !== null ? (payload as UnknownRecord) : {}
  return {
    id: ensureString(record.id ?? record.quoteId ?? record.quote_id, generateId('quote')),
    number: ensureString(record.number ?? record.quoteNumber ?? record.quote_number ?? record.reference ?? 'Q-0001'),
    client: ensureString(record.client ?? record.clientName ?? record.customer ?? 'Onbekende klant'),
    amount: ensureNumber(record.amount ?? record.total ?? record.value, 0),
    date: ensureIsoDate(record.date ?? record.created_at ?? record.issued_at),
    status: normaliseQuoteStatus(record.status),
  }
}

function normalisePayment(payload: unknown): Payment {
  const record: UnknownRecord = typeof payload === 'object' && payload !== null ? (payload as UnknownRecord) : {}
  return {
    id: ensureString(record.id ?? record.paymentId ?? record.payment_id, generateId('pay')),
    invoiceId: ensureString(record.invoiceId ?? record.invoice_id ?? record.invoiceIdRef ?? ''),
    amount: ensureNumber(record.amount ?? record.total ?? record.value, 0),
    date: ensureIsoDate(record.date ?? record.created_at ?? record.paid_at),
    status: ensureString(record.status ?? 'processed'),
  }
}

function normaliseStats(payload: unknown): FinanceStats {
  const record: UnknownRecord = typeof payload === 'object' && payload !== null ? (payload as UnknownRecord) : {}
  return {
    monthlyRevenue: ensureNumber(record.monthlyRevenue ?? record.revenue ?? record.monthly_revenue, 0),
    pendingInvoicesTotal: ensureNumber(record.pendingInvoicesTotal ?? record.pending ?? record.outstanding, 0),
    paidInvoicesTotal: ensureNumber(record.paidInvoicesTotal ?? record.paid ?? record.collected, 0),
  }
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as UnknownRecord | undefined
    const message = data?.message ?? data?.detail
    if (typeof message === 'string' && message.trim()) {
      return message
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

async function requestInvoices(): Promise<Invoice[]> {
  const response = await axios.get(`${API_BASE}/invoices`)
  const payload = Array.isArray(response.data) ? response.data : []
  return payload.map(normaliseInvoice)
}

async function requestInvoice(id: string): Promise<Invoice> {
  const response = await axios.get(`${API_BASE}/invoices/${id}`)
  return normaliseInvoice(response.data)
}

async function requestQuotes(): Promise<Quote[]> {
  const response = await axios.get(`${API_BASE}/quotes`)
  const payload = Array.isArray(response.data) ? response.data : []
  return payload.map(normaliseQuote)
}

async function requestStats(): Promise<FinanceStats> {
  const response = await axios.get(`${API_BASE}/stats`)
  return normaliseStats(response.data)
}

async function requestPayments(): Promise<Payment[]> {
  const response = await axios.get(`${API_BASE}/payments`)
  const payload = Array.isArray(response.data) ? response.data : []
  return payload.map(normalisePayment)
}

async function postInvoice(payload: InvoiceUpsertPayload): Promise<Invoice> {
  const response = await axios.post(`${API_BASE}/invoices`, serialiseInvoicePayload(payload))
  return normaliseInvoice(response.data)
}

async function putInvoice(id: string, payload: InvoiceUpsertPayload): Promise<Invoice> {
  const response = await axios.put(`${API_BASE}/invoices/${id}`, serialiseInvoicePayload(payload))
  return normaliseInvoice(response.data)
}

async function postQuote(payload: QuoteUpsertPayload): Promise<Quote> {
  const response = await axios.post(`${API_BASE}/quotes`, serialiseQuotePayload(payload))
  return normaliseQuote(response.data)
}

async function convertQuote(id: string): Promise<Invoice> {
  const response = await axios.post(`${API_BASE}/quotes/${id}/convert`)
  return normaliseInvoice(response.data)
}

async function postPayment(payload: PaymentPayload): Promise<Payment> {
  const response = await axios.post(`${API_BASE}/payments`, serialisePaymentPayload(payload))
  return normalisePayment(response.data)
}

function serialiseInvoicePayload(payload: InvoiceUpsertPayload): UnknownRecord {
  return {
    clientName: payload.clientName,
    invoiceDate: ensureIsoDate(payload.invoiceDate),
    dueDate: ensureIsoDate(payload.dueDate),
    lineItems: payload.lineItems.map((item, index) => ({
      id: item.id ?? generateId(`line_${index}`),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    total: payload.total,
    status: payload.status ?? 'pending',
  }
}

function serialiseQuotePayload(payload: QuoteUpsertPayload): UnknownRecord {
  return {
    client: payload.client,
    amount: payload.amount,
    date: ensureIsoDate(payload.date),
    status: payload.status ?? 'draft',
    number: payload.number,
  }
}

function serialisePaymentPayload(payload: PaymentPayload): UnknownRecord {
  return {
    invoiceId: payload.invoiceId,
    amount: payload.amount,
    date: payload.date ? ensureIsoDate(payload.date) : undefined,
    status: payload.status,
    method: payload.method,
  }
}

export const financeStore = create<FinanceState>()(
  immer((set, get) => ({
    invoices: [],
    quotes: [],
    payments: [],
    stats: null,
    loading: false,
    error: null,
    async fetchInvoices() {
      set(state => {
        state.loading = true
        state.error = null
      })
      try {
        const invoices = await requestInvoices()
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
    async createInvoice(invoiceData) {
      set(state => {
        state.loading = true
        state.error = null
      })
      try {
        const invoice = await postInvoice(invoiceData)
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
        const updated = await putInvoice(id, invoiceData)
        set(state => {
          const index = state.invoices.findIndex(invoice => invoice.id === id)
          if (index >= 0) {
            state.invoices[index] = updated
          } else {
            state.invoices.push(updated)
          }
          state.loading = false
        })
        return updated
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
    async fetchQuotes() {
      set(state => {
        state.loading = true
        state.error = null
      })
      try {
        const quotes = await requestQuotes()
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
        const quote = await postQuote(quoteData)
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
        const invoice = await convertQuote(quoteId)
        set(state => {
          state.quotes = state.quotes.filter(quote => quote.id !== quoteId)
          state.invoices.push(invoice)
          state.loading = false
        })
        return invoice
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to convert quote')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },
    async fetchPayments() {
      set(state => {
        state.loading = true
        state.error = null
      })
      try {
        const payments = await requestPayments()
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
        const payment = await postPayment(paymentData)
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
        const stats = await requestStats()
        set(state => {
          state.stats = stats
          state.loading = false
        })
        return stats
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to fetch stats')
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
        const invoice = await requestInvoice(id)
        set(state => {
          state.invoices.push(invoice)
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
    async getDashboardData() {
      set(state => {
        state.loading = true
        state.error = null
      })
      try {
        const [invoices, stats] = await Promise.all([requestInvoices(), requestStats()])
        set(state => {
          state.invoices = invoices
          state.stats = stats
          state.loading = false
        })
        return { invoices, stats }
      } catch (error) {
        const message = resolveErrorMessage(error, 'Failed to load dashboard data')
        set(state => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },
    async getQuotes() {
      const currentQuotes = get().quotes
      if (currentQuotes.length > 0 && !get().error) {
        return currentQuotes
      }
      return get().fetchQuotes()
    },
    clearError() {
      set(state => {
        state.error = null
      })
    },
  }))
)

const store = Object.assign(financeStore, {
  fetchInvoices: () => financeStore.getState().fetchInvoices(),
  createInvoice: (invoiceData: InvoiceUpsertPayload) => financeStore.getState().createInvoice(invoiceData),
  updateInvoice: (id: string, invoiceData: InvoiceUpsertPayload) => financeStore.getState().updateInvoice(id, invoiceData),
  deleteInvoice: (id: string) => financeStore.getState().deleteInvoice(id),
  fetchQuotes: () => financeStore.getState().fetchQuotes(),
  createQuote: (quoteData: QuoteUpsertPayload) => financeStore.getState().createQuote(quoteData),
  convertQuoteToInvoice: (quoteId: string) => financeStore.getState().convertQuoteToInvoice(quoteId),
  fetchPayments: () => financeStore.getState().fetchPayments(),
  recordPayment: (paymentData: PaymentPayload) => financeStore.getState().recordPayment(paymentData),
  getFinanceStats: () => financeStore.getState().getFinanceStats(),
  getInvoiceById: (id: string) => financeStore.getState().getInvoiceById(id),
  getDashboardData: () => financeStore.getState().getDashboardData(),
  getQuotes: () => financeStore.getState().getQuotes(),
  clearError: () => financeStore.getState().clearError(),
})

export default store
