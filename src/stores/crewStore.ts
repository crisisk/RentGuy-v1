import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'
import { create } from 'zustand'
import { produce } from 'immer'

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
  updateTimeEntry: (id: string, status: UpdateTimeEntryStatus) => Promise<void>
  resetError: () => void
}

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message
}

function normaliseCrewMember(raw: any): CrewMember {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    role: String(raw.role ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  }
}

function normaliseShift(raw: any): CrewShift {
  return {
    id: String(raw.id ?? ''),
    memberId: String(raw.memberId ?? raw.crewMemberId ?? ''),
    date: String(raw.date ?? raw.start?.split?.('T')?.[0] ?? ''),
    start: String(raw.start ?? raw.startTime ?? ''),
    end: String(raw.end ?? raw.endTime ?? ''),
    memberName: raw.memberName ? String(raw.memberName) : undefined,
  }
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

const useCrewStore = create<CrewState>((set, get) => ({
  crew: [],
  shifts: [],
  timeOff: [],
  timeEntries: [],
  loading: false,
  error: null,
  async fetchCrew() {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.get(CREW_ENDPOINT)
      const crew = Array.isArray(response.data) ? response.data.map(normaliseCrewMember) : []
      set((state) => ({ ...state, crew, loading: false }))
      return crew
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async createCrewMember(payload) {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.post(CREW_ENDPOINT, payload)
      const created = normaliseCrewMember(
        response.data ?? {
          ...payload,
          id: generateTemporaryId('crew'),
        },
      )
      set(
        produce<CrewState>((draft) => {
          draft.loading = false
          draft.crew.push(created)
        }),
      )
      return created
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async fetchShifts() {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.get(SHIFT_ENDPOINT)
      const shifts = Array.isArray(response.data) ? response.data.map(normaliseShift) : []
      set((state) => ({ ...state, shifts, loading: false }))
      return shifts
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async assignShift(payload) {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.post(SHIFT_ENDPOINT, payload)
      const created = normaliseShift(
        response.data ?? {
          ...payload,
          id: generateTemporaryId('shift'),
        },
      )
      const member = get().crew.find((crewMember) => crewMember.id === created.memberId)
      const shiftWithName = { ...created, memberName: created.memberName ?? member?.name }
      set(
        produce<CrewState>((draft) => {
          draft.loading = false
          draft.shifts.push(shiftWithName)
        }),
      )
      return shiftWithName
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async fetchTimeOff() {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.get(TIME_OFF_ENDPOINT)
      const requests = Array.isArray(response.data) ? response.data.map(normaliseTimeOff) : []
      set((state) => ({ ...state, timeOff: requests, loading: false }))
      return requests
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async requestTimeOff(payload) {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.post(TIME_OFF_ENDPOINT, payload)
      const created = normaliseTimeOff(
        response.data ?? {
          ...payload,
          id: generateTemporaryId('timeoff'),
        },
      )
      set(
        produce<CrewState>((draft) => {
          draft.loading = false
          draft.timeOff.push(created)
        }),
      )
      return created
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async fetchTimeEntries() {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      const response = await api.get(TIME_ENTRY_ENDPOINT)
      const entries = Array.isArray(response.data) ? response.data.map(normaliseTimeEntry) : []
      set((state) => ({ ...state, timeEntries: entries, loading: false }))
      return entries
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  async updateTimeEntry(id, status) {
    set((state) => ({ ...state, loading: true, error: null }))
    try {
      await api.patch(`${TIME_ENTRY_ENDPOINT}/${id}`, { status })
      set(
        produce<CrewState>((draft) => {
          draft.loading = false
          const entry = draft.timeEntries.find((item) => item.id === id)
          if (entry) {
            entry.status = status
          }
        }),
      )
    } catch (error) {
      const message = resolveError(error)
      set((state) => ({ ...state, loading: false, error: message }))
      throw new Error(message)
    }
  },
  resetError() {
    set((state) => ({ ...state, error: null }))
  },
}))

async function getWeeklyShifts(
  start: string,
  end: string,
): Promise<Array<CrewShift & { employeeName: string }>> {
  const store = useCrewStore.getState()
  if (store.shifts.length === 0) {
    try {
      await store.fetchShifts()
    } catch {
      return []
    }
  }
  const { shifts, crew } = useCrewStore.getState()
  return shifts
    .filter((shift) => shift.date >= start && shift.date <= end)
    .map((shift) => ({
      ...shift,
      employeeName:
        shift.memberName ?? crew.find((member) => member.id === shift.memberId)?.name ?? 'Onbekend',
    }))
}

async function getTimeEntries(): Promise<TimeEntry[]> {
  const store = useCrewStore.getState()
  if (store.timeEntries.length === 0) {
    try {
      return await store.fetchTimeEntries()
    } catch {
      return []
    }
  }
  return store.timeEntries
}

const crewStore = Object.assign(useCrewStore, {
  fetchCrew: () => useCrewStore.getState().fetchCrew(),
  createCrewMember: (payload: CreateCrewMemberPayload) =>
    useCrewStore.getState().createCrewMember(payload),
  fetchShifts: () => useCrewStore.getState().fetchShifts(),
  assignShift: (payload: CreateShiftPayload) => useCrewStore.getState().assignShift(payload),
  fetchTimeOff: () => useCrewStore.getState().fetchTimeOff(),
  requestTimeOff: (payload: CreateTimeOffPayload) =>
    useCrewStore.getState().requestTimeOff(payload),
  getWeeklyShifts,
  getTimeEntries,
  updateTimeEntry: (id: string, status: UpdateTimeEntryStatus) =>
    useCrewStore.getState().updateTimeEntry(id, status),
})

export default crewStore
export type {
  CreateCrewMemberPayload,
  CreateShiftPayload,
  CreateTimeOffPayload,
  UpdateTimeEntryStatus,
}
