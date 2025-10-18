import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CrewAlert, CrewCalendarDay, CrewMember, CrewRole, ShiftAssignment } from '@rg-types/crewTypes'

export type CrewStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CrewBaseState {
  status: CrewStoreStatus
  error: string | null
  members: CrewMember[]
  assignments: ShiftAssignment[]
  calendar: CrewCalendarDay[]
  alerts: CrewAlert[]
  filterRole: CrewRole | 'all'
}

export interface CrewStoreState extends CrewBaseState {
  hydrate(payload: Partial<Omit<CrewStoreState, 'hydrate' | 'setLoading' | 'setError'>>): void
  setLoading(): void
  setError(message: string): void
}

function createInitialState(): CrewBaseState {
  return {
    status: 'idle',
    error: null,
    members: [],
    assignments: [],
    calendar: [],
    alerts: [],
    filterRole: 'all',
  }
}

export const useCrewStore = create(
  immer<CrewStoreState>((set) => ({
    ...createInitialState(),
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
  })),
)

export function resetCrewStore(): void {
  const base = createInitialState()
  useCrewStore.setState((draft) => {
    draft.status = base.status
    draft.error = base.error
    draft.members = base.members
    draft.assignments = base.assignments
    draft.calendar = base.calendar
    draft.alerts = base.alerts
    draft.filterRole = base.filterRole
  })
}
