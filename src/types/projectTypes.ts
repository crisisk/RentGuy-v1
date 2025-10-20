export type ProjectStatus = 'upcoming' | 'active' | 'completed' | 'at_risk'

export type RiskLevel = 'ok' | 'warning' | 'critical'

export type StatusFilter = 'all' | ProjectStatus

export type RiskFilter = 'all' | RiskLevel

export type SortKey = 'start' | 'end' | 'start_offset' | 'client' | 'status' | 'risk'

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
  readonly label: string
  readonly description?: string
  readonly statusFilter?: StatusFilter
  readonly riskFilter?: RiskFilter
  readonly timeFilter?: TimeFilter
  readonly sortKey?: SortKey
  readonly sortDir?: SortDirection
  readonly searchTerm?: string
}

export interface PlannerProjectDto {
  readonly id: string | number
  readonly name: string
  readonly client_name: string
  readonly start_date?: string
  readonly end_date?: string
  readonly status?: string
  readonly inventory_risk?: string
  readonly inventory_alerts?: unknown
  readonly duration_days?: number | null
  readonly days_until_start?: number | null
  readonly notes?: string | null
}

export interface PlannerEvent {
  readonly id: string
  readonly name: string
  readonly client: string
  readonly start: string
  readonly end: string
  readonly status: ProjectStatus
  readonly risk: RiskLevel
  readonly alerts: string[]
  readonly durationDays: number | null
  readonly daysUntilStart: number | null
  readonly notes: string
}

