import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'

const CREW_BASE_PATH = '/api/crew'
const MEMBERS_PATH = `${CREW_BASE_PATH}`
const SHIFTS_PATH = `${CREW_BASE_PATH}/shifts`
const TIME_OFF_PATH = `${CREW_BASE_PATH}/time-off`
const TIME_ENTRIES_PATH = `${CREW_BASE_PATH}/time-entries`

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
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly role: string
  readonly skills?: string[]
}

type CreateShiftPayload = {
  readonly memberId: string
  readonly date: string
  readonly start: string
  readonly end: string
}

type CreateTimeOffPayload = {
  readonly memberId: string
  readonly start: string
  readonly end: string
  readonly reason: string
}

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
  updateTimeEntry: (id: string, status: 'approved' | 'rejected') => Promise<void>
  getWeeklyShifts: (start?: string, end?: string) => Promise<WeeklyShift[]>
  resetError: () => void
}

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

function toDateString(value: unknown, fallback: Date = new Date()): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return fallback.toISOString()
}

function parseCrewMember(payload: unknown): CrewMember | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? record.memberId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const name = record.name ?? record.fullName
  const role = record.role ?? record.position
  const email = record.email ?? record.mail
  const phone = record.phone ?? record.phoneNumber
  const skills = Array.isArray(record.skills)
    ? record.skills.filter((skill: unknown): skill is string => typeof skill === 'string')
    : []

  if (!name || !role) {
    return null
  }

  const member: CrewMember = {
    id: toStringSafe(id),
    name: toStringSafe(name, 'Onbekend lid'),
    role: toStringSafe(role, 'crew'),
    email: toStringSafe(email),
    phone: toStringSafe(phone),
    skills,
  }

  if (record.createdAt) {
    member.createdAt = toDateString(record.createdAt)
  }

  return member
}

function parseShift(payload: unknown): CrewShift | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const record = payload as Record<string, unknown>
  const id = record.id ?? record.shiftId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const memberId = record.memberId ?? record.crewMemberId ?? record.employeeId
  const start = record.start ?? record.startTime
  const end = record.end ?? record.endTime
  const date = record.date ?? record.startDate ?? start

  if (!memberId || !start || !end) {
    return null
  }
  const shift: CrewShift = {
    id: toStringSafe(id),
    memberId: toStringSafe(memberId),
    start: toDateString(start),
    end: toDateString(end),
    date: toDateString(date),
  }

  if (record.memberName) {
    shift.memberName = toStringSafe(record.memberName)
  }

  return shift
}

function parseTimeOff(payload: unknown): TimeOffRequest | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const record = payload as Record<string, unknown>
  const id = record.id ?? record.requestId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const memberId = record.memberId ?? record.crewMemberId ?? record.employeeId
  const start = record.start ?? record.startDate
  const end = record.end ?? record.endDate
  const reason = record.reason ?? record.notes ?? ''

  if (!memberId || !start || !end) {
    return null
  }
  const request: TimeOffRequest = {
    id: toStringSafe(id),
    memberId: toStringSafe(memberId),
    start: toDateString(start),
    end: toDateString(end),
    reason: toStringSafe(reason),
  }

  return request
}

function parseTimeEntry(payload: unknown): TimeEntry | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const record = payload as Record<string, unknown>
  const id = record.id ?? record.entryId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const date = record.date ?? record.loggedAt ?? record.startedAt
  const hours = Number(record.hours ?? record.duration ?? 0)
  const description = record.description ?? record.summary ?? ''
  const status = record.status
  const user = record.user ?? record.employee ?? {}

  const entry: TimeEntry = {
    id: toStringSafe(id),
    date: toDateString(date),
    hours: Number.isFinite(hours) ? hours : 0,
    description: toStringSafe(description),
    status: status === 'approved' || status === 'rejected' ? status : 'pending',
    user: {
      id: toStringSafe((user as Record<string, unknown>).id ?? record.userId ?? ''),
      name: toStringSafe((user as Record<string, unknown>).name ?? record.userName ?? 'Onbekend'),
    },
  }

  return entry
}

export const useCrewStore = create<CrewState>()(
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

    fetchCrew: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(MEMBERS_PATH)
        const crew = Array.isArray(response.data)
          ? response.data
              .map(parseCrewMember)
              .filter((member): member is CrewMember => member !== null)
          : []

        set((state) => {
          state.crew = crew
          state.loading = false
        })

        return crew
      } catch (error) {
        const message = resolveError(error, 'Kon crewleden niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    createCrewMember: async (payload) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(MEMBERS_PATH, payload)
        const member = parseCrewMember({ ...payload, ...response.data })
        if (!member) {
          throw new Error('Onbekend antwoord bij het aanmaken van het crewlid')
        }

        set((state) => {
          state.crew.push(member)
          state.loading = false
        })

        return member
      } catch (error) {
        const message = resolveError(error, 'Kon crewlid niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchShifts: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(SHIFTS_PATH)
        const shifts = Array.isArray(response.data)
          ? response.data.map(parseShift).filter((shift): shift is CrewShift => shift !== null)
          : []

        set((state) => {
          state.shifts = shifts
          state.loading = false
        })

        return shifts
      } catch (error) {
        const message = resolveError(error, 'Kon diensten niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    assignShift: async (payload) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(SHIFTS_PATH, payload)
        const shift = parseShift({ ...payload, ...response.data })
        if (!shift) {
          throw new Error('Onbekend antwoord bij het plannen van de dienst')
        }

        set((state) => {
          state.shifts.push(shift)
          state.loading = false
        })

        return shift
      } catch (error) {
        const message = resolveError(error, 'Kon dienst niet plannen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchTimeOff: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(TIME_OFF_PATH)
        const requests = Array.isArray(response.data)
          ? response.data
              .map(parseTimeOff)
              .filter((request): request is TimeOffRequest => request !== null)
          : []

        set((state) => {
          state.timeOff = requests
          state.loading = false
        })

        return requests
      } catch (error) {
        const message = resolveError(error, 'Kon verlofaanvragen niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    requestTimeOff: async (payload) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(TIME_OFF_PATH, payload)
        const request = parseTimeOff({ ...payload, ...response.data })
        if (!request) {
          throw new Error('Onbekend antwoord bij het aanvragen van verlof')
        }

        set((state) => {
          state.timeOff.push(request)
          state.loading = false
        })

        return request
      } catch (error) {
        const message = resolveError(error, 'Kon verlof niet aanvragen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchTimeEntries: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(TIME_ENTRIES_PATH)
        const entries = Array.isArray(response.data)
          ? response.data.map(parseTimeEntry).filter((entry): entry is TimeEntry => entry !== null)
          : []

        set((state) => {
          state.timeEntries = entries
          state.loading = false
        })

        return entries
      } catch (error) {
        const message = resolveError(error, 'Kon tijdsregistraties niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getTimeEntries: async () => {
      const { timeEntries } = get()
      if (timeEntries.length > 0) {
        return timeEntries
      }
      return get().fetchTimeEntries()
    },

    updateTimeEntry: async (id, status) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        await api.patch(`${TIME_ENTRIES_PATH}/${id}`, { status })
        set((state) => {
          const entry = state.timeEntries.find((candidate) => candidate.id === id)
          if (entry) {
            entry.status = status
          }
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error, 'Kon tijdsregistratie niet bijwerken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getWeeklyShifts: async (start, end) => {
      const response = await api.get(`${SHIFTS_PATH}/weekly`, {
        params: { start, end },
      })

      const shifts = Array.isArray(response.data)
        ? response.data
            .map((entry) => {
              const shift = parseShift(entry)
              if (!shift) {
                return null
              }
              return {
                ...shift,
                employeeName: shift.memberName ?? 'Onbekend',
                startTime: shift.start,
                endTime: shift.end,
              }
            })
            .filter((value): value is WeeklyShift => value !== null)
        : []

      return shifts
    },
  })),
)

const crewStore = Object.assign(useCrewStore, {
  fetchCrew: () => useCrewStore.getState().fetchCrew(),
  createCrewMember: (payload: CreateCrewMemberPayload) =>
    useCrewStore.getState().createCrewMember(payload),
  fetchShifts: () => useCrewStore.getState().fetchShifts(),
  assignShift: (payload: CreateShiftPayload) => useCrewStore.getState().assignShift(payload),
  fetchTimeOff: () => useCrewStore.getState().fetchTimeOff(),
  requestTimeOff: (payload: CreateTimeOffPayload) =>
    useCrewStore.getState().requestTimeOff(payload),
  fetchTimeEntries: () => useCrewStore.getState().fetchTimeEntries(),
  getTimeEntries: () => useCrewStore.getState().getTimeEntries(),
  updateTimeEntry: (id: string, status: 'approved' | 'rejected') =>
    useCrewStore.getState().updateTimeEntry(id, status),
  getWeeklyShifts: (start?: string, end?: string) =>
    useCrewStore.getState().getWeeklyShifts(start, end),
  resetError: () => useCrewStore.getState().resetError(),
})

export default crewStore
