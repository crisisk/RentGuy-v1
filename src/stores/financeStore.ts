import type { FinanceAlert, FinanceSnapshot, InvoiceRecord, QuoteRecord } from '@rg-types/financeTypes'
import { createStore } from './storeFactory'

export type FinanceStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface FinanceStoreState {
  status: FinanceStoreStatus
  error: string | null
  invoices: InvoiceRecord[]
  quotes: QuoteRecord[]
  snapshot: FinanceSnapshot | null
  alerts: FinanceAlert[]
  hydrate(payload: Partial<Omit<FinanceStoreState, 'hydrate' | 'setLoading' | 'setError'>>): void
  setLoading(): void
  setError(message: string): void
  upsertInvoice(invoice: InvoiceRecord): void
}

export const financeStore = createStore<FinanceStoreState>((set) => ({
  status: 'idle',
  error: null,
  invoices: [],
  quotes: [],
  snapshot: null,
  alerts: [],
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
}))

export const useFinanceStore = financeStore.useStore
