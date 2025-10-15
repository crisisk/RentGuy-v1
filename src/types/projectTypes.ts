export type ProjectStatus = 'active' | 'upcoming' | 'completed' | 'at_risk'
export type RiskLevel = 'ok' | 'warning' | 'critical'
export type StatusFilter = ProjectStatus | 'all'
export type RiskFilter = RiskLevel | 'all'
export type SortKey = 'start' | 'end' | 'client' | 'status' | 'risk'
export type SortDirection = 'asc' | 'desc'
export type TimeFilter = 'all' | 'today' | 'next7' | 'next14' | 'next30' | 'past30'

export type PersonaKey =
  | 'all'
  | 'bart'
  | 'anna'
  | 'tom'
  | 'carla'
  | 'frank'
  | 'sven'
  | 'isabelle'
  | 'peter'
  | 'nadia'
  | 'david'

export interface PersonaPreset {
  label: string
  description: string
  statusFilter?: StatusFilter
  riskFilter?: RiskFilter
  sortKey?: SortKey
  sortDir?: SortDirection
  timeFilter?: TimeFilter
  searchTerm?: string
}

export interface PlannerProjectDto {
  id: string | number
  name: string
  client_name: string
  start_date: string
  end_date?: string | null
  status?: string | null
  inventory_risk?: string | null
  inventory_alerts?: unknown
  duration_days?: number | null
  days_until_start?: number | null
  notes?: string | null
}

export interface PlannerEvent {
  id: string
  name: string
  client: string
  start: string
  end: string
  status: ProjectStatus
  risk: RiskLevel
  alerts: string[]
  durationDays: number | null
  daysUntilStart: number | null
  notes: string
}

export interface PlannerFilters {
  status: StatusFilter
  risk: RiskFilter
  time: TimeFilter
  searchTerm: string
  sortKey: SortKey
  sortDir: SortDirection
}
