import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { FinanceAlert, FinanceSnapshot, InvoiceRecord, QuoteRecord } from '@rg-types/financeTypes'

export type FinanceStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

interface FinanceBaseState {
  status: FinanceStoreStatus
  error: string | null
  invoices: InvoiceRecord[]
  quotes: QuoteRecord[]
  snapshot: FinanceSnapshot | null
  alerts: FinanceAlert[]
}

export interface FinanceStoreState extends FinanceBaseState {
  hydrate(payload: Partial<Omit<FinanceStoreState, 'hydrate' | 'setLoading' | 'setError' | 'upsertInvoice'>>): void
  setLoading(): void
  setError(message: string): void
  upsertInvoice(invoice: InvoiceRecord): void
}

function createInitialState(): FinanceBaseState {
  return {
    status: 'idle',
    error: null,
    invoices: [],
    quotes: [],
    snapshot: null,
    alerts: [],
  }
}

export const useFinanceStore = create(
  immer<FinanceStoreState>((set) => ({
    ...createInitialState(),
    hydrate: (payload) => {
      set((draft) => {
        draft.status = payload.status ?? 'ready'
        if (payload.invoices) draft.invoices = payload.invoices
        if (payload.quotes) draft.quotes = payload.quotes
        if (payload.snapshot !== undefined) draft.snapshot = payload.snapshot
        if (payload.alerts) draft.alerts = payload.alerts
        if (payload.error !== undefined) {
          draft.error = payload.error
        }
      })
    },
    setLoading: () => {
      set((draft) => {
        draft.status = 'loading'
        draft.error = null
      })
    },
    setError: (message) => {
      set((draft) => {
        draft.status = 'error'
        draft.error = message
      })
    },
    upsertInvoice: (invoice) => {
      set((draft) => {
        const index = draft.invoices.findIndex((item) => item.id === invoice.id)
        if (index >= 0) {
          draft.invoices[index] = invoice
        } else {
          draft.invoices.push(invoice)
        }
      })
    },
  })),
)

export function resetFinanceStore(): void {
  const base = createInitialState()
  useFinanceStore.setState((draft) => {
    draft.status = base.status
    draft.error = base.error
    draft.invoices = base.invoices
    draft.quotes = base.quotes
    draft.snapshot = base.snapshot
    draft.alerts = base.alerts
  })
}
