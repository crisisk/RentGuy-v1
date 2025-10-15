import type { CrmSyncState, CustomerActivity, LeadRecord, PipelineSummary } from '@rg-types/crmTypes'
import { createStore } from './storeFactory'

export type CrmStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CrmStoreState {
  status: CrmStoreStatus
  error: string | null
  leads: LeadRecord[]
  pipeline: PipelineSummary[]
  activities: CustomerActivity[]
  sync: CrmSyncState
  setLoading(): void
  hydrate(payload: Partial<Omit<CrmStoreState, 'hydrate' | 'setLoading' | 'setError'>>): void
  setError(message: string): void
}

export const crmStore = createStore<CrmStoreState>((set) => ({
  status: 'idle',
  error: null,
  leads: [],
  pipeline: [],
  activities: [],
  sync: {
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  },
  setLoading: () => {
    set((draft) => {
      draft.status = 'loading'
      draft.error = null
      draft.sync.isSyncing = true
    })
  },
  hydrate: (payload) => {
    set((draft) => {
      draft.status = payload.status ?? 'ready'
      if (payload.leads) draft.leads = payload.leads
      if (payload.pipeline) draft.pipeline = payload.pipeline
      if (payload.activities) draft.activities = payload.activities
      if (payload.sync) draft.sync = { ...draft.sync, ...payload.sync }
      if (payload.error !== undefined) {
        draft.error = payload.error
      }
    })
  },
  setError: (message) => {
    set((draft) => {
      draft.status = 'error'
      draft.error = message
      draft.sync.isSyncing = false
      draft.sync.error = message
    })
  },
}))

export const useCrmStore = crmStore.useStore
