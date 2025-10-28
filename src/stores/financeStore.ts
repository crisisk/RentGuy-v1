import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'draft'

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
  status: 'draft' | 'sent' | 'converted'
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
  clearError: () => void
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
}

const FINANCE_BASE_PATH = '/api/v1/finance'
const INVOICES_PATH = `${FINANCE_BASE_PATH}/invoices`
const QUOTES_PATH = `${FINANCE_BASE_PATH}/quotes`
const PAYMENTS_PATH = `${FINANCE_BASE_PATH}/payments`
const STATS_PATH = `${FINANCE_BASE_PATH}/stats`

function resolveError(error: unknown, fallback: string): string {
  const mapped = mapUnknownToApiError(error)
  return mapped.message || fallback
}

function toStringSafe(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return fallback
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }
  return new Date().toISOString()
}

function ensureLineItems(items: unknown): InvoiceLineItem[] {
  if (!Array.isArray(items)) {
    return []
  }
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const id = record.id ?? crypto.randomUUID?.() ?? `${Date.now()}`
      const description = record.description ?? record.label
      const quantity = Number(record.quantity ?? record.qty ?? 0)
      const unitPrice = Number(record.unitPrice ?? record.price ?? record.unit_price ?? 0)

      return {
        id: toStringSafe(id),
        description: toStringSafe(description),
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      }
    })
    .filter((item): item is InvoiceLineItem => item !== null)
}

function parseInvoice(payload: unknown): Invoice | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? record.invoiceId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const client = record.clientName ?? record.client ?? 'Onbekende klant'
  const status = record.status ?? (record.converted ? 'converted' : 'pending')
  const amount = Number(
    record.amount ??
      record.total ??
      record.totalGross ??
      record.total_gross ??
      record.total_net ??
      0,
  )

  const invoice: Invoice = {
    id: toStringSafe(id),
    clientName: toStringSafe(client, 'Onbekende klant'),
    amount: Number.isFinite(amount) ? amount : 0,
    date: toDateString(record.date ?? record.issuedAt ?? record.issued_at ?? Date.now()),
    status: status === 'paid' || status === 'overdue' || status === 'draft' ? status : 'pending',
    lineItems: ensureLineItems(record.lineItems ?? record.line_items),
  }

  if (record.dueDate || record.due_at) {
    invoice.dueDate = toDateString(record.dueDate ?? record.due_at)
  }

  const description = record.description ? toStringSafe(record.description) : ''
  if (description) {
    invoice.description = description
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
    id: toStringSafe(id),
    number: toStringSafe(number),
    client: toStringSafe(record.client ?? record.clientName ?? 'Onbekende klant'),
    amount: Number.isFinite(amount) ? amount : 0,
    date: toDateString(record.date ?? record.validUntil ?? record.valid_until ?? Date.now()),
    status: normalisedStatus,
    converted: Boolean(record.converted ?? normalisedStatus === 'converted'),
  }
}

function parsePayment(payload: unknown): Payment | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const record = payload as Record<string, unknown>
  const id = record.id ?? record.paymentId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const amount = Number(record.amount ?? 0)
  const payment: Payment = {
    id: toStringSafe(id),
    amount: Number.isFinite(amount) ? amount : 0,
    invoiceId: toStringSafe(record.invoiceId ?? record.invoice_id ?? ''),
    method: toStringSafe(record.method ?? record.provider ?? 'unknown'),
  }

  if (record.processedAt || record.processed_at) {
    payment.processedAt = toDateString(record.processedAt ?? record.processed_at)
  }

  return payment
}

function deriveStats(invoices: Invoice[]): FinanceStats {
  const pendingInvoicesTotal = invoices
    .filter((invoice) => invoice.status === 'pending' || invoice.status === 'draft')
    .reduce((total, invoice) => total + invoice.amount, 0)

  const paidInvoicesTotal = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((total, invoice) => total + invoice.amount, 0)

  return {
    monthlyRevenue: paidInvoicesTotal,
    pendingInvoicesTotal,
    paidInvoicesTotal,
  }
}

function toInvoiceRequest(invoice: InvoiceInput) {
  const lineItems = invoice.lineItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))
  const fallbackTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  return {
    client: invoice.clientName,
    date: toDateString(invoice.invoiceDate),
    dueDate: invoice.dueDate ? toDateString(invoice.dueDate) : undefined,
    lineItems,
    total: invoice.total ?? fallbackTotal,
    description: invoice.description,
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
      set((state) => {
        state.error = null
      })
    },

    fetchInvoices: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(INVOICES_PATH)
        const invoices = Array.isArray(response.data)
          ? response.data
              .map(parseInvoice)
              .filter((invoice): invoice is Invoice => invoice !== null)
          : []

        set((state) => {
          state.invoices = invoices
          state.loading = false
        })

        return invoices
      } catch (error) {
        const message = resolveError(error, 'Kon facturen niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getInvoiceById: async (id) => {
      const existing = get().invoices.find((invoice) => invoice.id === id)
      if (existing) {
        return existing
      }

      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${INVOICES_PATH}/${id}`)
        const invoice = parseInvoice({ ...response.data, id })
        if (!invoice) {
          return null
        }

        set((state) => {
          state.invoices.push(invoice)
          state.loading = false
        })

        return invoice
      } catch (error) {
        const message = resolveError(error, 'Kon factuur niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        return null
      }
    },

    createInvoice: async (invoice) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = toInvoiceRequest(invoice)
        const response = await api.post(INVOICES_PATH, payload)
        const created = parseInvoice({ ...invoice, ...response.data })
        if (!created) {
          throw new Error('Onbekend antwoord bij het aanmaken van de factuur')
        }

        set((state) => {
          state.invoices.push({ ...created, lineItems: invoice.lineItems })
          state.loading = false
        })

        return { ...created, lineItems: invoice.lineItems }
      } catch (error) {
        const message = resolveError(error, 'Kon factuur niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    updateInvoice: async (id, invoice) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = toInvoiceRequest(invoice)
        const response = await api.put(`${INVOICES_PATH}/${id}`, payload)
        const updated = parseInvoice({ ...invoice, ...response.data, id })
        if (!updated) {
          throw new Error('Onbekend antwoord bij het bijwerken van de factuur')
        }

        const withLines = { ...updated, lineItems: invoice.lineItems }

        set((state) => {
          const index = state.invoices.findIndex((item) => item.id === id)
          if (index >= 0) {
            state.invoices[index] = withLines
          } else {
            state.invoices.push(withLines)
          }
          state.loading = false
        })

        return withLines
      } catch (error) {
        const message = resolveError(error, 'Kon factuur niet bijwerken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    deleteInvoice: async (id) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        await api.delete(`${INVOICES_PATH}/${id}`)
        set((state) => {
          state.invoices = state.invoices.filter((invoice) => invoice.id !== id)
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error, 'Kon factuur niet verwijderen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchQuotes: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(QUOTES_PATH)
        const quotes = Array.isArray(response.data)
          ? response.data.map(parseQuote).filter((quote): quote is Quote => quote !== null)
          : []

        set((state) => {
          state.quotes = quotes
          state.loading = false
        })

        return quotes
      } catch (error) {
        const message = resolveError(error, 'Kon offertes niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getQuotes: async () => {
      const { quotes } = get()
      if (quotes.length > 0) {
        return quotes
      }
      return get().fetchQuotes()
    },

    convertQuoteToInvoice: async (quoteId) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(`${QUOTES_PATH}/${quoteId}/convert`)
        const invoice = parseInvoice(response.data)
        if (!invoice) {
          throw new Error('Onbekend antwoord bij het omzetten van de offerte')
        }

        set((state) => {
          state.invoices.push(invoice)
          state.quotes = state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, status: 'converted', converted: true } : quote,
          )
          state.loading = false
        })

        return invoice.id
      } catch (error) {
        const message = resolveError(error, 'Kon offerte niet omzetten')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchPayments: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(PAYMENTS_PATH)
        const payments = Array.isArray(response.data)
          ? response.data
              .map(parsePayment)
              .filter((payment): payment is Payment => payment !== null)
          : []

        set((state) => {
          state.payments = payments
          state.loading = false
        })

        return payments
      } catch (error) {
        const message = resolveError(error, 'Kon betalingen niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    recordPayment: async (payment) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = {
          amount: payment.amount,
          invoice_id: payment.invoiceId,
          method: payment.method,
        }
        const response = await api.post(PAYMENTS_PATH, payload)
        const created = parsePayment({ ...payment, ...response.data })
        if (!created) {
          throw new Error('Onbekend antwoord bij het registreren van de betaling')
        }

        set((state) => {
          state.payments.push(created)
          state.loading = false
        })

        return created
      } catch (error) {
        const message = resolveError(error, 'Kon betaling niet registreren')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getFinanceStats: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(STATS_PATH)
        const statsPayload = response.data ?? {}
        const invoices = get().invoices
        const baseStats = deriveStats(invoices)
        const enriched: FinanceStats = {
          monthlyRevenue:
            Number(
              statsPayload.revenue ?? statsPayload.monthlyRevenue ?? baseStats.monthlyRevenue,
            ) || baseStats.monthlyRevenue,
          pendingInvoicesTotal:
            Number(statsPayload.pendingInvoicesTotal ?? baseStats.pendingInvoicesTotal) ||
            baseStats.pendingInvoicesTotal,
          paidInvoicesTotal:
            Number(statsPayload.paidInvoicesTotal ?? baseStats.paidInvoicesTotal) ||
            baseStats.paidInvoicesTotal,
        }

        set((state) => {
          state.stats = enriched
          state.loading = false
        })

        return enriched
      } catch (error) {
        const invoices = get().invoices
        const fallback = deriveStats(invoices)
        const message = resolveError(error, 'Kon financiële statistieken niet laden')
        set((state) => {
          state.stats = fallback
          state.loading = false
          state.error = message
        })
        return fallback
      }
    },

    getDashboardData: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const invoices = await get().fetchInvoices()
        const stats = await get().getFinanceStats()
        set((state) => {
          state.loading = false
        })
        return { invoices, stats }
      } catch {
        const invoices = get().invoices
        const stats = get().stats ?? deriveStats(invoices)
        set((state) => {
          state.loading = false
        })
        return { invoices, stats }
      }
    },
  })),
)

const financeStore = Object.assign(useFinanceStore, {
  clearError: () => useFinanceStore.getState().clearError(),
  fetchInvoices: () => useFinanceStore.getState().fetchInvoices(),
  getInvoiceById: (id: string) => useFinanceStore.getState().getInvoiceById(id),
  createInvoice: (invoice: InvoiceInput) => useFinanceStore.getState().createInvoice(invoice),
  updateInvoice: (id: string, invoice: InvoiceInput) =>
    useFinanceStore.getState().updateInvoice(id, invoice),
  deleteInvoice: (id: string) => useFinanceStore.getState().deleteInvoice(id),
  fetchQuotes: () => useFinanceStore.getState().fetchQuotes(),
  getQuotes: () => useFinanceStore.getState().getQuotes(),
  convertQuoteToInvoice: (quoteId: string) =>
    useFinanceStore.getState().convertQuoteToInvoice(quoteId),
  fetchPayments: () => useFinanceStore.getState().fetchPayments(),
  recordPayment: (payment: Omit<Payment, 'id' | 'processedAt'>) =>
    useFinanceStore.getState().recordPayment(payment),
  getFinanceStats: () => useFinanceStore.getState().getFinanceStats(),
  getDashboardData: () => useFinanceStore.getState().getDashboardData(),
})

export default financeStore
