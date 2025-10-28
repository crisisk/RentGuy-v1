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
  currentProject: Project | null
  timeline: TimelineEvent[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<Project[]>
  createProject: (data: Omit<Project, 'id'>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  fetchTimeline: (projectId: string) => Promise<TimelineEvent[]>
  addTimelineEvent: (data: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent>
  getProjectById: (id: string) => Promise<ProjectDetails | null>
  getProject: (id: string) => Promise<Project | null>
  clearError: () => void
}

const PROJECTS_BASE_PATH = '/api/v1/projects'

function resolveErrorMessage(error: unknown): string {
  return mapUnknownToApiError(error).message
}

function toProjectStatus(rawStatus: unknown): ProjectStatus {
  const candidate = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : ''
  if (candidate === 'IN_PROGRESS' || candidate === 'COMPLETED' || candidate === 'ON_HOLD') {
    return candidate
  }
  return 'PLANNING'
}

function normaliseProject(raw: any): Project {
  const project: Project = {
    id: String(raw.id ?? raw.projectId ?? ''),
    name: String(raw.name ?? raw.title ?? 'Onbekend project'),
    description: String(raw.description ?? ''),
    status: toProjectStatus(raw.status),
    startDate: new Date(raw.startDate ?? raw.start_date ?? Date.now()).toISOString(),
  }

  const endCandidate = raw.endDate ?? raw.end_date
  if (endCandidate) {
    project.endDate = new Date(endCandidate).toISOString()
  }

  if (raw.client) {
    project.client = String(raw.client)
  }

  return project
}

function normaliseTimelineEvent(raw: any): TimelineEvent {
  return {
    id: String(raw.id ?? ''),
    projectId: String(raw.projectId ?? raw.project_id ?? ''),
    title: String(raw.title ?? 'Event'),
    description: String(raw.description ?? ''),
    date: new Date(raw.date ?? Date.now()).toISOString(),
    type: (raw.type ?? 'event') as TimelineEvent['type'],
  }
}

const useProjectStoreBase = create<ProjectState>()(
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
        const response = await api.get<Project[]>(PROJECTS_BASE_PATH)
        const projects = Array.isArray(response.data) ? response.data.map(normaliseProject) : []

        set((state) => {
          state.projects = projects
          state.loading = false
        })

        return projects
      } catch (error) {
        const message = resolveErrorMessage(error)
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
        const response = await api.post<Project>(PROJECTS_BASE_PATH, data)
        const project = normaliseProject({ ...data, ...response.data })
        set((state) => {
          state.projects.push(project)
          state.loading = false
        })
        return project
      } catch (error) {
        const message = resolveErrorMessage(error)
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
        const response = await api.put<Project>(`${PROJECTS_BASE_PATH}/${id}`, data)
        const merged = { ...data, ...response.data }
        merged.id = id
        const project = normaliseProject(merged)
        set((state) => {
          state.projects = state.projects.map((existing) =>
            existing.id === project.id ? project : existing,
          )
          if (state.currentProject?.id === project.id) {
            state.currentProject = project
          }
          state.loading = false
        })
        return project
      } catch (error) {
        const message = resolveErrorMessage(error)
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
        const message = resolveErrorMessage(error)
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
        const response = await api.get<TimelineEvent[]>(
          `${PROJECTS_BASE_PATH}/${projectId}/timeline`,
        )
        const events = Array.isArray(response.data) ? response.data.map(normaliseTimelineEvent) : []

        set((state) => {
          state.timeline = events
          state.loading = false
        })

        return events
      } catch (error) {
        const message = resolveErrorMessage(error)
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
        const response = await api.post<TimelineEvent>(
          `${PROJECTS_BASE_PATH}/${data.projectId}/timeline`,
          data,
        )
        const event = normaliseTimelineEvent({ ...data, ...response.data })
        set((state) => {
          state.timeline.push(event)
          state.loading = false
        })
        return event
      } catch (error) {
        const message = resolveErrorMessage(error)
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getProjectById: async (id: string) => {
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
        const response = await api.get<Project>(`${PROJECTS_BASE_PATH}/${id}`)
        const merged = { ...response.data }
        merged.id = id
        const project = normaliseProject(merged)
        set((state) => {
          state.projects.push(project)
          state.loading = false
        })
        return {
          ...project,
          crewMembers: [],
          equipment: [],
        }
      } catch (error) {
        const message = resolveErrorMessage(error)
        set((state) => {
          state.loading = false
          state.error = message
        })
        return null
      }
    },

    getProject: async (id: string) => {
      const project = get().projects.find((existing) => existing.id === id)
      if (project) {
        return project
      }

      const details = await get().getProjectById(id)
      return details ?? null
    },
  })),
)

const projectStore = Object.assign(useProjectStoreBase, {
  clearError: () => useProjectStoreBase.getState().clearError(),
  fetchProjects: () => useProjectStoreBase.getState().fetchProjects(),
  createProject: (data: Omit<Project, 'id'>) => useProjectStoreBase.getState().createProject(data),
  updateProject: (data: Partial<Project> & { id: string }) =>
    useProjectStoreBase.getState().updateProject(data.id, data),
  deleteProject: (id: string) => useProjectStoreBase.getState().deleteProject(id),
  fetchTimeline: (projectId: string) => useProjectStoreBase.getState().fetchTimeline(projectId),
  addTimelineEvent: (data: Omit<TimelineEvent, 'id'>) =>
    useProjectStoreBase.getState().addTimelineEvent(data),
  getProjects: async () => {
    const store = useProjectStoreBase.getState()
    if (store.projects.length === 0) {
      await store.fetchProjects()
    }
    return useProjectStoreBase.getState().projects
  },
  getStats: () => {
    const projects = useProjectStoreBase.getState().projects
    return Promise.resolve({
      totalTasks: projects.length * 10,
      completedTasks: projects.filter((project) => project.status === 'COMPLETED').length * 10,
    })
  },
  getRecentActivities: () => {
    const projects = useProjectStoreBase.getState().projects
    return Promise.resolve(
      projects.slice(0, 5).map((project) => ({
        id: project.id,
        title: project.name,
        date: project.startDate,
        status: project.status === 'COMPLETED' ? 'completed' : 'in-progress',
      })),
    )
  },
  getProjectById: (id: string) => useProjectStoreBase.getState().getProjectById(id),
  getProject: (id: string) => useProjectStoreBase.getState().getProject(id),
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
