import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'
import type { PersonaKey, PersonaPreset } from '@rg-types/projectTypes'

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  startDate: string
  endDate?: string
  createdAt: string
  teamSize: number
  client?: string
}

export interface ProjectDetails extends Project {
  crewMembers: Array<{ id: string; name: string; role: string; email: string }>
  equipment: Array<{ id: string; name: string; type: string; quantity: number }>
}

export interface TimelineEvent {
  id: string
  projectId: string
  title: string
  description: string
  date: string
  type: 'milestone' | 'deadline' | 'event'
}

interface ProjectState {
  projects: Project[]
  currentProject: ProjectDetails | null
  timeline: TimelineEvent[]
  loading: boolean
  error: string | null
  clearError: () => void
  fetchProjects: () => Promise<Project[]>
  createProject: (
    data: Omit<Project, 'id' | 'createdAt' | 'teamSize'> & { teamSize?: number },
  ) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  fetchTimeline: (projectId: string) => Promise<TimelineEvent[]>
  addTimelineEvent: (data: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent>
  getProjectById: (id: string) => Promise<ProjectDetails | null>
  getProject: (id: string) => Promise<Project | null>
}

const PROJECTS_BASE_PATH = '/api/v1/projects'

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
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }
  return fallback.toISOString()
}

function toStatus(value: unknown): ProjectStatus {
  if (value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'ON_HOLD') {
    return value
  }
  return 'PLANNING'
}

function parseProject(payload: unknown): Project | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? record.projectId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const name = record.name ?? record.title
  const description = record.description ?? record.summary ?? ''
  const startDate = record.startDate ?? record.start_date ?? Date.now()
  const status = toStatus(record.status)
  const teamSize = Number(record.teamSize ?? record.team_size ?? 0)

  if (!name) {
    return null
  }

  const project: Project = {
    id: toStringSafe(id),
    name: toStringSafe(name, 'Onbekend project'),
    description: toStringSafe(description),
    status,
    startDate: toDateString(startDate),
    createdAt:
      record.createdAt || record.created_at
        ? toDateString(record.createdAt ?? record.created_at)
        : toDateString(Date.now()),
    teamSize: Number.isFinite(teamSize) ? teamSize : 0,
  }

  if (record.endDate || record.end_date) {
    project.endDate = toDateString(record.endDate ?? record.end_date)
  }

  const clientName = record.client ? toStringSafe(record.client) : ''
  if (clientName) {
    project.client = clientName
  }

  return project
}

function parseProjectDetails(payload: unknown): ProjectDetails | null {
  const project = parseProject(payload)
  if (!project) {
    return null
  }

  const record = payload as Record<string, unknown>
  const crew: Array<{ id: string; name: string; role: string; email: string }> = Array.isArray(
    record.crewMembers,
  )
    ? record.crewMembers
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null
          }
          const crewRecord = entry as Record<string, unknown>
          const id = crewRecord.id ?? crypto.randomUUID?.() ?? `${Date.now()}`
          return {
            id: toStringSafe(id),
            name: toStringSafe(crewRecord.name ?? crewRecord.fullName ?? 'Onbekend lid'),
            role: toStringSafe(crewRecord.role ?? crewRecord.position ?? 'crew'),
            email: toStringSafe(crewRecord.email ?? ''),
          }
        })
        .filter(
          (value): value is { id: string; name: string; role: string; email: string } =>
            value !== null,
        )
    : []

  const equipment: Array<{ id: string; name: string; type: string; quantity: number }> =
    Array.isArray(record.equipment)
      ? record.equipment
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null
            }
            const equipmentRecord = entry as Record<string, unknown>
            const id = equipmentRecord.id ?? crypto.randomUUID?.() ?? `${Date.now()}`
            const quantity = Number(equipmentRecord.quantity ?? equipmentRecord.qty ?? 0)
            return {
              id: toStringSafe(id),
              name: toStringSafe(equipmentRecord.name ?? 'Onbekend item'),
              type: toStringSafe(equipmentRecord.type ?? equipmentRecord.category ?? 'overig'),
              quantity: Number.isFinite(quantity) ? quantity : 0,
            }
          })
          .filter(
            (value): value is { id: string; name: string; type: string; quantity: number } =>
              value !== null,
          )
      : []

  return {
    ...project,
    crewMembers: crew,
    equipment,
  }
}

function parseTimelineEvent(payload: unknown): TimelineEvent | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const record = payload as Record<string, unknown>
  const id = record.id ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const projectId = record.projectId ?? record.project_id
  const title = record.title ?? record.name
  const description = record.description ?? record.summary ?? ''
  const date = record.date ?? record.occurredAt ?? record.occurred_at ?? Date.now()
  const type = record.type ?? 'event'

  if (!projectId || !title) {
    return null
  }

  const normalisedType: TimelineEvent['type'] =
    type === 'milestone' || type === 'deadline' ? type : 'event'

  return {
    id: toStringSafe(id),
    projectId: toStringSafe(projectId),
    title: toStringSafe(title),
    description: toStringSafe(description),
    date: toDateString(date),
    type: normalisedType,
  }
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    projects: [],
    currentProject: null,
    timeline: [],
    loading: false,
    error: null,

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    fetchProjects: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(PROJECTS_BASE_PATH)
        const projects = Array.isArray(response.data)
          ? response.data
              .map(parseProject)
              .filter((project): project is Project => project !== null)
          : []

        set((state) => {
          state.projects = projects
          state.loading = false
        })

        return projects
      } catch (error) {
        const message = resolveError(error, 'Kon projecten niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    createProject: async (data) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(PROJECTS_BASE_PATH, data)
        const project = parseProject({ ...data, ...response.data })
        if (!project) {
          throw new Error('Onbekend antwoord bij het aanmaken van het project')
        }

        set((state) => {
          state.projects.push(project)
          state.loading = false
        })

        return project
      } catch (error) {
        const message = resolveError(error, 'Kon project niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    updateProject: async (id, data) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.put(`${PROJECTS_BASE_PATH}/${id}`, data)
        const project = parseProject({ ...data, ...response.data, id })
        if (!project) {
          throw new Error('Onbekend antwoord bij het bijwerken van het project')
        }

        set((state) => {
          const index = state.projects.findIndex((item) => item.id === id)
          if (index >= 0) {
            state.projects[index] = project
          } else {
            state.projects.push(project)
          }
          if (state.currentProject?.id === id) {
            state.currentProject = {
              ...state.currentProject,
              ...project,
            }
          }
          state.loading = false
        })

        return project
      } catch (error) {
        const message = resolveError(error, 'Kon project niet bijwerken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    deleteProject: async (id) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        await api.delete(`${PROJECTS_BASE_PATH}/${id}`)
        set((state) => {
          state.projects = state.projects.filter((project) => project.id !== id)
          if (state.currentProject?.id === id) {
            state.currentProject = null
          }
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error, 'Kon project niet verwijderen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchTimeline: async (projectId) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${PROJECTS_BASE_PATH}/${projectId}/timeline`)
        const events = Array.isArray(response.data)
          ? response.data
              .map(parseTimelineEvent)
              .filter((event): event is TimelineEvent => event !== null)
          : []

        set((state) => {
          state.timeline = events
          state.loading = false
        })

        return events
      } catch (error) {
        const message = resolveError(error, 'Kon projecttijdlijn niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    addTimelineEvent: async (data) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(`${PROJECTS_BASE_PATH}/${data.projectId}/timeline`, data)
        const event = parseTimelineEvent({ ...data, ...response.data })
        if (!event) {
          throw new Error('Onbekend antwoord bij het aanmaken van het tijdlijnevent')
        }

        set((state) => {
          state.timeline.push(event)
          state.loading = false
        })

        return event
      } catch (error) {
        const message = resolveError(error, 'Kon tijdlijnevent niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getProjectById: async (id) => {
      const cached = get().projects.find((project) => project.id === id)
      if (cached) {
        return {
          ...cached,
          crewMembers: [],
          equipment: [],
        }
      }

      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${PROJECTS_BASE_PATH}/${id}`)
        const details = parseProjectDetails({ ...response.data, id })
        if (!details) {
          return null
        }

        set((state) => {
          state.projects.push(details)
          state.currentProject = details
          state.loading = false
        })

        return details
      } catch (error) {
        const message = resolveError(error, 'Kon projectdetails niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        return null
      }
    },

    getProject: async (id) => {
      const project = get().projects.find((existing) => existing.id === id)
      if (project) {
        return project
      }
      const details = await get().getProjectById(id)
      return details
    },
  })),
)

const projectStore = Object.assign(useProjectStore, {
  clearError: () => useProjectStore.getState().clearError(),
  fetchProjects: () => useProjectStore.getState().fetchProjects(),
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'teamSize'> & { teamSize?: number }) =>
    useProjectStore.getState().createProject(data),
  updateProject: (data: Partial<Project> & { id: string }) =>
    useProjectStore.getState().updateProject(data.id, data),
  deleteProject: (id: string) => useProjectStore.getState().deleteProject(id),
  fetchTimeline: (projectId: string) => useProjectStore.getState().fetchTimeline(projectId),
  addTimelineEvent: (data: Omit<TimelineEvent, 'id'>) =>
    useProjectStore.getState().addTimelineEvent(data),
  getProjectById: (id: string) => useProjectStore.getState().getProjectById(id),
  getProject: (id: string) => useProjectStore.getState().getProject(id),
  getProjects: async () => {
    const store = useProjectStore.getState()
    if (store.projects.length === 0) {
      await store.fetchProjects()
    }
    return useProjectStore.getState().projects
  },
  getStats: async () => {
    const projects = await projectStore.getProjects()
    const total = projects.length
    const completed = projects.filter((project) => project.status === 'COMPLETED').length
    return {
      totalProjects: total,
      completedProjects: completed,
      activeProjects: projects.filter((project) => project.status === 'IN_PROGRESS').length,
      upcomingProjects: projects.filter((project) => project.status === 'PLANNING').length,
    }
  },
  getRecentActivities: async () => {
    const projects = await projectStore.getProjects()
    return projects.slice(0, 5).map((project) => ({
      id: project.id,
      title: project.name,
      date: project.startDate,
      status: project.status === 'COMPLETED' ? 'completed' : 'in-progress',
    }))
  },
})

export const defaultProjectPresets: Record<PersonaKey, PersonaPreset> = {
  all: {
    label: "Alle persona's",
    description: 'Volledige planning zonder filters voor gezamenlijke UAT-sessies.',
    statusFilter: 'all',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  bart: {
    label: 'Bart · Operations lead',
    description: "Actieve projecten en voorraadrisico's in één overzicht voor directe bijsturing.",
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  anna: {
    label: 'Anna · Planner',
    description: 'Komende projecten chronologisch om draaiboeken te verfijnen.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  tom: {
    label: 'Tom · Technicus',
    description: 'Focus op lopende producties voor shifts en onsite-briefings.',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'today',
  },
  carla: {
    label: 'Carla · Front-office',
    description: 'Sorteer op klantnaam om vragen vanuit klantenservice snel te beantwoorden.',
    statusFilter: 'upcoming',
    sortKey: 'client',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  frank: {
    label: 'Frank · Finance',
    description: 'Afgeronde projecten voor facturatiecontroles en cashflow updates.',
    statusFilter: 'completed',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
  },
  sven: {
    label: 'Sven · System admin',
    description: "Escalaties en kritieke risico's prioriteren voor governance en alerts.",
    statusFilter: 'all',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
  isabelle: {
    label: 'Isabelle · International coordinator',
    description: 'Komende internationale events ruim vooraf inzichtelijk houden.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  peter: {
    label: 'Peter · Power-user',
    description: 'Voorraadspanning en statusovergangen monitoren voor automatiseringen.',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  nadia: {
    label: 'Nadia · Nieuw teamlid',
    description: 'Beperk zicht tot eenvoudig komende projecten voor een zachte onboarding.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  david: {
    label: 'David · Developer',
    description: 'Alle statussen zichtbaar houden om API-extensies te testen.',
    statusFilter: 'all',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  operations: {
    label: 'Operations cockpit',
    description: 'Prioriteer actieve projecten en risicoalerts voor de operatie-room.',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  support: {
    label: 'Support handovers',
    description: 'Markeer projecten met lopende incidents voor crew-support.',
    statusFilter: 'active',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'today',
  },
  cfo: {
    label: 'CFO forecast',
    description: 'Volg afgeronde en komende projecten voor facturatie en omzet.',
    statusFilter: 'completed',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
  },
  compliance: {
    label: 'Compliance & governance',
    description: 'Controleer projecten met escalaties en governance-aandachtspunten.',
    statusFilter: 'all',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
  sales: {
    label: 'Sales enablement',
    description: 'Bekijk projecten binnen 30 dagen voor commerciële opvolging.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
}

export default projectStore
