import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  PersonaKey,
  PersonaPreset,
  PlannerEvent,
  PlannerFilters,
  PlannerProjectDto,
  ProjectStatus,
  RiskLevel,
} from '@rg-types/projectTypes'

export type ProjectStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ProjectBaseState {
  status: ProjectStoreStatus
  error: string | null
  persona: PersonaKey
  presets: Record<PersonaKey, PersonaPreset>
  filters: PlannerFilters
  projects: PlannerProjectDto[]
  events: PlannerEvent[]
  lastSyncedAt: string | null
}

export interface ProjectStoreState extends ProjectBaseState {
  hydrate(payload: Partial<Omit<ProjectStoreState, 'hydrate' | 'setLoading' | 'setError' | 'setPersona' | 'updateFilters'>>): void
  setPersona(persona: PersonaKey): void
  updateFilters(filters: Partial<PlannerFilters>): void
  setLoading(): void
  setError(message: string): void
}

export const defaultProjectFilters: PlannerFilters = {
  status: 'all',
  risk: 'all',
  time: 'all',
  searchTerm: '',
  sortKey: 'start',
  sortDir: 'asc',
}

export const defaultProjectPresets: Record<PersonaKey, PersonaPreset> = {
  all: { label: 'Alle rollen', description: 'Ongefilterd overzicht voor gezamenlijke stand-ups.' },
  bart: {
    label: 'Bart de Manager',
    description: 'Focus op kritieke projecten met verhoogd risico.',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next7',
  },
  anna: {
    label: 'Anna de Planner',
    description: 'Chronologisch overzicht van komende shows met afhankelijkheden.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  tom: {
    label: 'Tom de Technicus',
    description: 'Realtime zicht op lopende opdrachten inclusief briefingnotities.',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'today',
  },
  carla: {
    label: 'Carla van Front-Office',
    description: 'Shows gegroepeerd per klant om vragen snel te beantwoorden.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'client',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  frank: {
    label: 'Frank de Financieel Specialist',
    description: 'Afgeronde projecten en documentatie om facturatie te versnellen.',
    statusFilter: 'completed',
    riskFilter: 'all',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
  },
  sven: {
    label: 'Sven de Systeembeheerder',
    description: 'Filtert kritieke risico’s en voorraadalerts voor escalatiebeheer.',
    statusFilter: 'all',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
  isabelle: {
    label: 'Isabelle de International',
    description: 'Kijkt weken vooruit om internationale producties te synchroniseren.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  peter: {
    label: 'Peter de Power-User',
    description: 'Combineert status- en risicoviews voor automatiseringen.',
    statusFilter: 'all',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  nadia: {
    label: 'Nadia de Nieuweling',
    description: 'Behoudt focus op eerstvolgende eenvoudige taken voor onboarding.',
    statusFilter: 'upcoming',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next7',
  },
  david: {
    label: 'David de Auditor',
    description: 'Projecten met openstaande controles en auditpunten.',
    statusFilter: 'at_risk',
    riskFilter: 'warning',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
}

function normalizeStatus(status?: string | null): ProjectStatus {
  if (status === 'at_risk' || status === 'completed' || status === 'upcoming' || status === 'active') {
    return status
  }
  return 'upcoming'
}

function normalizeRisk(risk?: string | null): RiskLevel {
  if (risk === 'ok' || risk === 'warning' || risk === 'critical') {
    return risk
  }
  return 'ok'
}

function toEvent(dto: PlannerProjectDto): PlannerEvent {
  return {
    id: String(dto.id),
    name: dto.name,
    client: dto.client_name,
    start: dto.start_date,
    end: dto.end_date ?? dto.start_date,
    status: normalizeStatus(dto.status ?? undefined),
    risk: normalizeRisk(dto.inventory_risk ?? undefined),
    alerts: Array.isArray(dto.inventory_alerts)
      ? (dto.inventory_alerts as string[])
      : dto.inventory_alerts
        ? [String(dto.inventory_alerts)]
        : [],
    durationDays: dto.duration_days ?? null,
    daysUntilStart: dto.days_until_start ?? null,
    notes: dto.notes ?? '',
  }
}

function createInitialState(): ProjectBaseState {
  return {
    status: 'idle',
    error: null,
    persona: 'all',
    presets: defaultProjectPresets,
    filters: defaultProjectFilters,
    projects: [],
    events: [],
    lastSyncedAt: null,
  }
}

export const useProjectStore = create<ProjectStoreState>(
  immer((set) => ({
    ...createInitialState(),
    hydrate: (payload) => {
      set((draft) => {
        draft.status = payload.status ?? 'ready'
        if (payload.projects) {
          draft.projects = payload.projects
          draft.events = payload.projects.map(toEvent)
        }
        if (payload.events) {
          draft.events = payload.events
        }
        if (payload.filters) {
          draft.filters = { ...draft.filters, ...payload.filters }
        }
        if (payload.persona) {
          draft.persona = payload.persona
        }
        if (payload.presets) {
          draft.presets = payload.presets
        }
        draft.lastSyncedAt = payload.lastSyncedAt ?? new Date().toISOString()
        if (payload.error !== undefined) {
          draft.error = payload.error
        }
      })
    },
    setPersona: (persona) => {
      set((draft) => {
        draft.persona = persona
        const preset = draft.presets[persona]
        if (preset) {
          draft.filters.status = preset.statusFilter ?? draft.filters.status
          draft.filters.risk = preset.riskFilter ?? draft.filters.risk
          draft.filters.sortKey = preset.sortKey ?? draft.filters.sortKey
          draft.filters.sortDir = preset.sortDir ?? draft.filters.sortDir
          draft.filters.time = preset.timeFilter ?? draft.filters.time
          draft.filters.searchTerm = preset.searchTerm ?? ''
        }
      })
    },
    updateFilters: (filters) => {
      set((draft) => {
        draft.filters = { ...draft.filters, ...filters }
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

export function resetProjectStore(): void {
  const base = createInitialState()
  useProjectStore.setState((draft) => {
    draft.status = base.status
    draft.error = base.error
    draft.persona = base.persona
    draft.presets = base.presets
    draft.filters = base.filters
    draft.projects = base.projects
    draft.events = base.events
    draft.lastSyncedAt = base.lastSyncedAt
  })
}
