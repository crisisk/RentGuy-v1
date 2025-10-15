import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CrmSyncState, CustomerActivity, LeadRecord, PipelineSummary } from '@rg-types/crmTypes'

export type CrmStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CrmBaseState {
  status: CrmStoreStatus
  error: string | null
  leads: LeadRecord[]
  pipeline: PipelineSummary[]
  activities: CustomerActivity[]
  sync: CrmSyncState
}

export interface CrmStoreState extends CrmBaseState {
  setLoading(): void
  hydrate(payload: Partial<Omit<CrmStoreState, 'hydrate' | 'setLoading' | 'setError'>>): void
  setError(message: string): void
}

function createInitialState(): CrmBaseState {
  return {
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
  }
}

export const useCrmStore = create<CrmStoreState>(
  immer((set) => ({
    ...createInitialState(),
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
  })),
)

export function resetCrmStore(): void {
  const base = createInitialState()
  useCrmStore.setState((draft) => {
    draft.status = base.status
    draft.error = base.error
    draft.leads = base.leads
    draft.pipeline = base.pipeline
    draft.activities = base.activities
    draft.sync = base.sync
  })
}
