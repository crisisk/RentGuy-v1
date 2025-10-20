import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  FinanceDashboardData,
  FinanceDashboardMetrics,
  InvoiceDraftInput,
  InvoiceRecord,
  PaymentDraft,
  PaymentRecord,
  QuoteRecord,
  InvoiceLineItem,
} from '@rg-types/financeTypes'

const VAT_RATE = 0.21

interface FinanceLoadingState {
  invoices: boolean
  quotes: boolean
  dashboard: boolean
  payments: boolean
}

interface FinanceState {
  invoices: InvoiceRecord[]
  quotes: QuoteRecord[]
  payments: PaymentRecord[]
  dashboardMetrics: FinanceDashboardMetrics | null
  loading: FinanceLoadingState
  error: string | null
  fetchInvoices: () => Promise<InvoiceRecord[]>
  getInvoiceById: (id: string) => Promise<InvoiceRecord>
  createInvoice: (input: InvoiceDraftInput) => Promise<InvoiceRecord>
  updateInvoice: (id: string, input: InvoiceDraftInput) => Promise<InvoiceRecord>
  deleteInvoice: (id: string) => Promise<void>
  fetchQuotes: () => Promise<QuoteRecord[]>
  getQuotes: () => Promise<QuoteRecord[]>
  convertQuoteToInvoice: (quoteId: string) => Promise<InvoiceRecord>
  fetchPayments: () => Promise<PaymentRecord[]>
  recordPayment: (payload: PaymentDraft) => Promise<PaymentRecord>
  getDashboardData: () => Promise<FinanceDashboardData>
  clearError: () => void
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function normaliseDate(value: string): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toISOString().slice(0, 10)
}

function generateId(prefix: string): string {
  const random = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}

function cloneLineItems(items: InvoiceLineItem[]): InvoiceLineItem[] {
  return items.map(item => ({ ...item }))
}

function buildInvoiceFromInput(id: string, input: InvoiceDraftInput, status: InvoiceRecord['status']): InvoiceRecord {
  const issuedAt = normaliseDate(input.invoiceDate)
  const dueAt = normaliseDate(input.dueDate)
  const totalNet = roundCurrency(input.total)
  const totalVat = roundCurrency(totalNet * VAT_RATE)
  const totalGross = roundCurrency(totalNet + totalVat)

  return {
    id,
    clientName: input.clientName,
    issuedAt,
    dueAt,
    status,
    currency: input.currency ?? 'EUR',
    lineItems: cloneLineItems(input.lineItems),
    totalNet,
    totalVat,
    totalGross,
    reference: input.reference ?? null,
    projectId: input.projectId ?? null,
  }
}

function computeDashboardMetrics(invoices: InvoiceRecord[], payments: PaymentRecord[]): FinanceDashboardMetrics {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyRevenue = payments
    .filter(payment => {
      const processed = new Date(payment.processedAt)
      if (Number.isNaN(processed.getTime())) {
        return false
      }
      return (
        payment.status === 'settled' &&
        processed.getMonth() === currentMonth &&
        processed.getFullYear() === currentYear
      )
    })
    .reduce((total, payment) => total + payment.amount, 0)

  const pendingInvoicesTotal = invoices
    .filter(invoice => invoice.status === 'pending' || invoice.status === 'sent' || invoice.status === 'draft')
    .reduce((total, invoice) => total + invoice.totalGross, 0)

  const paidInvoicesTotal = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((total, invoice) => total + invoice.totalGross, 0)

  return {
    monthlyRevenue: roundCurrency(monthlyRevenue),
    pendingInvoicesTotal: roundCurrency(pendingInvoicesTotal),
    paidInvoicesTotal: roundCurrency(paidInvoicesTotal),
  }
}

const initialInvoices: InvoiceRecord[] = [
  buildInvoiceFromInput('INV-2025-001', {
    clientName: 'Main Stage Events',
    invoiceDate: '2025-01-04',
    dueDate: '2025-01-18',
    lineItems: [
      { id: 'line-001', description: 'Stage lighting package', quantity: 4, unitPrice: 150 },
      { id: 'line-002', description: 'Crew overtime (hours)', quantity: 12, unitPrice: 35 },
    ],
    total: 1020,
    reference: 'PO-4587',
  }, 'paid'),
  buildInvoiceFromInput('INV-2025-002', {
    clientName: 'City Festival BV',
    invoiceDate: '2025-01-12',
    dueDate: '2025-01-26',
    lineItems: [
      { id: 'line-003', description: 'Sound system rental', quantity: 2, unitPrice: 450 },
      { id: 'line-004', description: 'Transport logistics', quantity: 1, unitPrice: 180 },
    ],
    total: 1080,
    reference: 'CF-2025-11',
  }, 'pending'),
  buildInvoiceFromInput('INV-2024-112', {
    clientName: 'Creative Expo Group',
    invoiceDate: '2024-12-20',
    dueDate: '2025-01-05',
    lineItems: [
      { id: 'line-005', description: 'Warehouse prep (hours)', quantity: 8, unitPrice: 60 },
      { id: 'line-006', description: 'Weekend crew standby', quantity: 6, unitPrice: 55 },
    ],
    total: 810,
    reference: 'EXP-7781',
  }, 'overdue'),
]

const initialQuotes: QuoteRecord[] = [
  {
    id: 'QUO-2025-031',
    number: 'QUO-2025-031',
    clientName: 'Skyline Productions',
    amount: 2450,
    issuedAt: '2025-01-08',
    status: 'sent',
  },
  {
    id: 'QUO-2025-024',
    number: 'QUO-2025-024',
    clientName: 'Northern Lights Agency',
    amount: 1750,
    issuedAt: '2025-01-03',
    status: 'draft',
  },
  {
    id: 'QUO-2024-198',
    number: 'QUO-2024-198',
    clientName: 'Festival One Europe',
    amount: 3820,
    issuedAt: '2024-12-19',
    status: 'converted',
  },
]

const initialPayments: PaymentRecord[] = [
  {
    id: 'PAY-2025-001',
    invoiceId: 'INV-2025-001',
    amount: roundCurrency(initialInvoices[0].totalGross),
    method: 'bank_transfer',
    processedAt: '2025-01-10T10:15:00.000Z',
    status: 'settled',
    reference: 'BT-983221',
  },
  {
    id: 'PAY-2024-122',
    invoiceId: 'INV-2024-112',
    amount: 450,
    method: 'card',
    processedAt: '2024-12-28T08:30:00.000Z',
    status: 'settled',
    reference: 'CARD-4422',
  },
]

const initialMetrics = computeDashboardMetrics(initialInvoices, initialPayments)

export const useFinanceStore = create<FinanceState>()(immer((set, get) => {
  const setLoading = (key: keyof FinanceLoadingState, value: boolean) => {
    set(state => {
      state.loading[key] = value
    })
  }

  const setError = (message: string | null) => {
    set(state => {
      state.error = message
    })
  }

  const fetchInvoices = async (): Promise<InvoiceRecord[]> => {
    setError(null)
    setLoading('invoices', true)
    try {
      return get().invoices
    } finally {
      setLoading('invoices', false)
    }
  }

  const getInvoiceById = async (id: string): Promise<InvoiceRecord> => {
    const invoice = get().invoices.find(item => item.id === id)
    if (!invoice) {
      const error = new Error('Factuur niet gevonden')
      setError(error.message)
      throw error
    }
    return invoice
  }

  const createInvoice = async (input: InvoiceDraftInput): Promise<InvoiceRecord> => {
    setError(null)
    setLoading('invoices', true)
    try {
      const invoice = buildInvoiceFromInput(generateId('INV'), input, 'pending')
      set(state => {
        state.invoices.unshift(invoice)
        state.dashboardMetrics = computeDashboardMetrics(state.invoices, state.payments)
      })
      return invoice
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Opslaan van factuur is mislukt'
      setError(message)
      throw error
    } finally {
      setLoading('invoices', false)
    }
  }

  const updateInvoice = async (id: string, input: InvoiceDraftInput): Promise<InvoiceRecord> => {
    setError(null)
    setLoading('invoices', true)
    try {
      let updated: InvoiceRecord | null = null
      set(state => {
        const index = state.invoices.findIndex(invoice => invoice.id === id)
        if (index === -1) {
          return
        }
        const currentStatus = state.invoices[index].status
        const nextInvoice = buildInvoiceFromInput(id, input, currentStatus)
        state.invoices[index] = nextInvoice
        updated = nextInvoice
        state.dashboardMetrics = computeDashboardMetrics(state.invoices, state.payments)
      })
      if (!updated) {
        const error = new Error('Factuur niet gevonden')
        setError(error.message)
        throw error
      }
      return updated
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bijwerken van factuur is mislukt'
      setError(message)
      throw error
    } finally {
      setLoading('invoices', false)
    }
  }

  const deleteInvoice = async (id: string): Promise<void> => {
    setError(null)
    setLoading('invoices', true)
    try {
      let removed = false
      set(state => {
        const before = state.invoices.length
        state.invoices = state.invoices.filter(invoice => invoice.id !== id)
        state.payments = state.payments.filter(payment => payment.invoiceId !== id)
        removed = state.invoices.length !== before
        state.dashboardMetrics = computeDashboardMetrics(state.invoices, state.payments)
      })
      if (!removed) {
        const error = new Error('Factuur kon niet worden verwijderd omdat deze niet bestaat')
        setError(error.message)
        throw error
      }
    } finally {
      setLoading('invoices', false)
    }
  }

  const fetchQuotes = async (): Promise<QuoteRecord[]> => {
    setError(null)
    setLoading('quotes', true)
    try {
      return get().quotes
    } finally {
      setLoading('quotes', false)
    }
  }

  const convertQuoteToInvoice = async (quoteId: string): Promise<InvoiceRecord> => {
    setError(null)
    setLoading('quotes', true)
    try {
      const quote = get().quotes.find(item => item.id === quoteId)
      if (!quote) {
        const error = new Error('Offerte niet gevonden')
        setError(error.message)
        throw error
      }
      if (quote.status === 'converted') {
        const error = new Error('Offerte is al geconverteerd naar een factuur')
        setError(error.message)
        throw error
      }

      const invoice = buildInvoiceFromInput(generateId('INV'), {
        clientName: quote.clientName,
        invoiceDate: quote.issuedAt,
        dueDate: quote.issuedAt,
        lineItems: [
          { id: generateId('line'), description: `Quote ${quote.number}`, quantity: 1, unitPrice: quote.amount },
        ],
        total: quote.amount,
        reference: quote.number,
      }, 'pending')

      set(state => {
        const targetQuote = state.quotes.find(item => item.id === quoteId)
        if (targetQuote) {
          targetQuote.status = 'converted'
        }
        state.invoices.unshift(invoice)
        state.dashboardMetrics = computeDashboardMetrics(state.invoices, state.payments)
      })

      return invoice
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const wrapped = new Error('Converteren van offerte is mislukt')
      setError(wrapped.message)
      throw wrapped
    } finally {
      setLoading('quotes', false)
    }
  }

  const fetchPayments = async (): Promise<PaymentRecord[]> => {
    setError(null)
    setLoading('payments', true)
    try {
      return get().payments
    } finally {
      setLoading('payments', false)
    }
  }

  const recordPayment = async (payload: PaymentDraft): Promise<PaymentRecord> => {
    setError(null)
    setLoading('payments', true)
    try {
      const payment: PaymentRecord = {
        id: generateId('PAY'),
        invoiceId: payload.invoiceId,
        amount: roundCurrency(payload.amount),
        method: payload.method,
        processedAt: new Date().toISOString(),
        status: 'settled',
        reference: payload.reference ?? null,
      }

      set(state => {
        state.payments.unshift(payment)
        const invoice = state.invoices.find(item => item.id === payload.invoiceId)
        if (invoice) {
          invoice.status = 'paid'
        }
        state.dashboardMetrics = computeDashboardMetrics(state.invoices, state.payments)
      })

      return payment
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registreren van betaling is mislukt'
      setError(message)
      throw error
    } finally {
      setLoading('payments', false)
    }
  }

  const getDashboardData = async (): Promise<FinanceDashboardData> => {
    setError(null)
    setLoading('dashboard', true)
    try {
      const invoices = get().invoices
      const metrics = computeDashboardMetrics(invoices, get().payments)
      set(state => {
        state.dashboardMetrics = metrics
      })
      return { invoices, metrics }
    } finally {
      setLoading('dashboard', false)
    }
  }

  return {
    invoices: initialInvoices,
    quotes: initialQuotes,
    payments: initialPayments,
    dashboardMetrics: initialMetrics,
    loading: {
      invoices: false,
      quotes: false,
      dashboard: false,
      payments: false,
    },
    error: null,
    fetchInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    fetchQuotes,
    getQuotes: fetchQuotes,
    convertQuoteToInvoice,
    fetchPayments,
    recordPayment,
    getDashboardData,
    clearError: () => set(state => {
      state.error = null
    }),
  }
}))

export default useFinanceStore
