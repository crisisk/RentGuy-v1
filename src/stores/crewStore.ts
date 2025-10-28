import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'

const CREW_ENDPOINT = '/api/crew'
const SHIFT_ENDPOINT = '/api/crew/shifts'
const TIME_OFF_ENDPOINT = '/api/crew/time-off'
const TIME_ENTRY_ENDPOINT = '/api/crew/time-entries'

export interface CrewMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  skills: string[]
  createdAt?: string
}

export interface CrewShift {
  id: string
  memberId: string
  date: string
  start: string
  end: string
  memberName?: string
}

export interface WeeklyShift extends CrewShift {
  employeeName: string
  startTime: string
  endTime: string
}

export interface TimeOffRequest {
  id: string
  memberId: string
  start: string
  end: string
  reason: string
}

export interface TimeEntry {
  id: string
  date: string
  hours: number
  description: string
  status: 'pending' | 'approved' | 'rejected'
  user: {
    id: string
    name: string
  }
}

type CreateCrewMemberPayload = {
  name: string
  email: string
  phone: string
  role: string
  skills?: string[]
}

type CreateShiftPayload = {
  memberId: string
  date: string
  start: string
  end: string
}

type CreateTimeOffPayload = {
  memberId: string
  start: string
  end: string
  reason: string
}

type UpdateTimeEntryStatus = 'approved' | 'rejected'

interface CrewState {
  crew: CrewMember[]
  shifts: CrewShift[]
  timeOff: TimeOffRequest[]
  timeEntries: TimeEntry[]
  loading: boolean
  error: string | null
  fetchCrew: () => Promise<CrewMember[]>
  createCrewMember: (payload: CreateCrewMemberPayload) => Promise<CrewMember>
  fetchShifts: () => Promise<CrewShift[]>
  assignShift: (payload: CreateShiftPayload) => Promise<CrewShift>
  fetchTimeOff: () => Promise<TimeOffRequest[]>
  requestTimeOff: (payload: CreateTimeOffPayload) => Promise<TimeOffRequest>
  fetchTimeEntries: () => Promise<TimeEntry[]>
  getTimeEntries: () => Promise<TimeEntry[]>
  updateTimeEntry: (id: string, status: UpdateTimeEntryStatus) => Promise<void>
  getWeeklyShifts: (start?: string, end?: string) => Promise<WeeklyShift[]>
  resetError: () => void
}

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message
}

function normaliseCrewMember(raw: any): CrewMember {
  const member: CrewMember = {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    role: String(raw.role ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
  }

  if (raw.createdAt) {
    member.createdAt = String(raw.createdAt)
  }

  return member
}

function normaliseShift(raw: any): CrewShift {
  const shift: CrewShift = {
    id: String(raw.id ?? ''),
    memberId: String(raw.memberId ?? raw.crewMemberId ?? ''),
    date: String(raw.date ?? raw.start?.split?.('T')?.[0] ?? ''),
    start: String(raw.start ?? raw.startTime ?? ''),
    end: String(raw.end ?? raw.endTime ?? ''),
  }

  if (raw.memberName) {
    shift.memberName = String(raw.memberName)
  }

  return shift
}

function normaliseTimeOff(raw: any): TimeOffRequest {
  return {
    id: String(raw.id ?? ''),
    memberId: String(raw.memberId ?? raw.crewMemberId ?? ''),
    start: String(raw.start ?? raw.startDate ?? ''),
    end: String(raw.end ?? raw.endDate ?? ''),
    reason: String(raw.reason ?? ''),
  }
}

function normaliseTimeEntry(raw: any): TimeEntry {
  return {
    id: String(raw.id ?? ''),
    date: String(raw.date ?? raw.loggedAt ?? ''),
    hours: Number(raw.hours ?? raw.duration ?? 0),
    description: String(raw.description ?? raw.notes ?? ''),
    status: raw.status === 'approved' || raw.status === 'rejected' ? raw.status : 'pending',
    user: {
      id: String(raw.user?.id ?? raw.employeeId ?? ''),
      name: String(raw.user?.name ?? raw.employeeName ?? ''),
    },
  }
}

function generateTemporaryId(prefix: string): string {
  const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID()
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const useCrewStoreBase = create<CrewState>()(
  immer((set, get) => ({
    crew: [],
    shifts: [],
    timeOff: [],
    timeEntries: [],
    loading: false,
    error: null,

    resetError: () => {
      set((state) => {
        state.error = null
      })
    },

    async fetchCrew() {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.get(CREW_ENDPOINT)
        const crew = Array.isArray(response.data) ? response.data.map(normaliseCrewMember) : []
        set((state) => {
          state.crew = crew
          state.loading = false
        })
        return crew
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async createCrewMember(payload) {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.post(CREW_ENDPOINT, payload)
        const created = normaliseCrewMember(
          response.data ?? {
            ...payload,
            id: generateTemporaryId('crew'),
          },
        )
        set((state) => {
          state.loading = false
          state.crew.push(created)
        })
        return created
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async fetchShifts() {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.get(SHIFT_ENDPOINT)
        const shifts = Array.isArray(response.data) ? response.data.map(normaliseShift) : []
        set((state) => {
          state.shifts = shifts
          state.loading = false
        })
        return shifts
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async assignShift(payload) {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.post(SHIFT_ENDPOINT, payload)
        const created = normaliseShift(
          response.data ?? {
            ...payload,
            id: generateTemporaryId('shift'),
          },
        )
        const member = get().crew.find((crewMember) => crewMember.id === created.memberId)
        const shiftWithName: CrewShift = { ...created }
        if (!shiftWithName.memberName && member?.name) {
          shiftWithName.memberName = member.name
        }
        set((state) => {
          state.loading = false
          state.shifts.push(shiftWithName)
        })
        return shiftWithName
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async fetchTimeOff() {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.get(TIME_OFF_ENDPOINT)
        const requests = Array.isArray(response.data) ? response.data.map(normaliseTimeOff) : []
        set((state) => {
          state.timeOff = requests
          state.loading = false
        })
        return requests
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async requestTimeOff(payload) {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.post(TIME_OFF_ENDPOINT, payload)
        const created = normaliseTimeOff(
          response.data ?? {
            ...payload,
            id: generateTemporaryId('timeoff'),
          },
        )
        set((state) => {
          state.loading = false
          state.timeOff.push(created)
        })
        return created
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async fetchTimeEntries() {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        const response = await api.get(TIME_ENTRY_ENDPOINT)
        const entries = Array.isArray(response.data) ? response.data.map(normaliseTimeEntry) : []
        set((state) => {
          state.timeEntries = entries
          state.loading = false
        })
        return entries
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getTimeEntries() {
      if (get().timeEntries.length === 0) {
        try {
          return await get().fetchTimeEntries()
        } catch {
          return []
        }
      }
      return get().timeEntries
    },

    async updateTimeEntry(id, status) {
      set((state) => {
        state.loading = true
        state.error = null
      })
      try {
        await api.post(`${TIME_ENTRY_ENDPOINT}/${id}`, { status })
        set((state) => {
          state.loading = false
          const entry = state.timeEntries.find((item) => item.id === id)
          if (entry) {
            entry.status = status
          }
        })
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    async getWeeklyShifts(start, end) {
      if (!start || !end) {
        return []
      }

      if (get().shifts.length === 0) {
        try {
          await get().fetchShifts()
        } catch {
          return []
        }
      }

      const { shifts, crew } = get()
      return shifts
        .filter((shift) => shift.date >= start && shift.date <= end)
        .map<WeeklyShift>((shift) => ({
          ...shift,
          employeeName:
            shift.memberName ??
            crew.find((member) => member.id === shift.memberId)?.name ??
            'Onbekend',
          startTime: shift.start,
          endTime: shift.end,
        }))
    },
  })),
)

const crewStore = Object.assign(useCrewStoreBase, {
  fetchCrew: () => useCrewStoreBase.getState().fetchCrew(),
  createCrewMember: (payload: CreateCrewMemberPayload) =>
    useCrewStoreBase.getState().createCrewMember(payload),
  fetchShifts: () => useCrewStoreBase.getState().fetchShifts(),
  assignShift: (payload: CreateShiftPayload) => useCrewStoreBase.getState().assignShift(payload),
  fetchTimeOff: () => useCrewStoreBase.getState().fetchTimeOff(),
  requestTimeOff: (payload: CreateTimeOffPayload) =>
    useCrewStoreBase.getState().requestTimeOff(payload),
  fetchTimeEntries: () => useCrewStoreBase.getState().fetchTimeEntries(),
  getTimeEntries: () => useCrewStoreBase.getState().getTimeEntries(),
  updateTimeEntry: (id: string, status: UpdateTimeEntryStatus) =>
    useCrewStoreBase.getState().updateTimeEntry(id, status),
  getWeeklyShifts: (start?: string, end?: string) =>
    useCrewStoreBase.getState().getWeeklyShifts(start, end),
  resetError: () => useCrewStoreBase.getState().resetError(),
})

export default crewStore
export type {
  CreateCrewMemberPayload,
  CreateShiftPayload,
  CreateTimeOffPayload,
  UpdateTimeEntryStatus,
}
