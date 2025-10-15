import type { CrewAlert, CrewCalendarDay, CrewMember, CrewRole, ShiftAssignment } from '@rg-types/crewTypes'
import { createStore } from './storeFactory'

export type CrewStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CrewStoreState {
  status: CrewStoreStatus
  error: string | null
  members: CrewMember[]
  assignments: ShiftAssignment[]
  calendar: CrewCalendarDay[]
  alerts: CrewAlert[]
  filterRole: CrewRole | 'all'
  hydrate(payload: Partial<Omit<CrewStoreState, 'hydrate' | 'setLoading' | 'setError'>>): void
  setLoading(): void
  setError(message: string): void
}

export const crewStore = createStore<CrewStoreState>((set) => ({
  status: 'idle',
  error: null,
  members: [],
  assignments: [],
  calendar: [],
  alerts: [],
  filterRole: 'all',
  hydrate: (payload) => {
    set((draft) => {
      draft.status = payload.status ?? 'ready'
      if (payload.members) draft.members = payload.members
      if (payload.assignments) draft.assignments = payload.assignments
      if (payload.calendar) draft.calendar = payload.calendar
      if (payload.alerts) draft.alerts = payload.alerts
      if (payload.filterRole) draft.filterRole = payload.filterRole
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
}))

export const useCrewStore = crewStore.useStore
