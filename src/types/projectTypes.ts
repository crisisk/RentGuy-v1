export type ProjectStatus = 'active' | 'upcoming' | 'completed' | 'at_risk'

export type RiskLevel = 'ok' | 'warning' | 'critical'

export type SortKey = 'start' | 'end' | 'status' | 'risk'

export type SortDirection = 'asc' | 'desc'

export type StatusFilter = 'all' | ProjectStatus

export type RiskFilter = 'all' | RiskLevel

export type TimeFilter = 'all' | 'today' | 'next7' | 'next14' | 'next30' | 'past30'

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

export interface PlannerProjectDto {
  readonly id: string | number
  readonly name: string
  readonly client_name: string
  readonly status: string
  readonly start_date?: string | null
  readonly end_date?: string | null
  readonly duration_days?: number | null
  readonly days_until_start?: number | null
  readonly inventory_risk?: string | null
  readonly inventory_alerts?: unknown
  readonly notes?: string | null
}

export type PlannerPersonaMetricKey =
  | 'totalProjects'
  | 'activeProjects'
  | 'criticalProjects'
  | 'warningProjects'
  | 'upcoming7Days'
  | 'upcoming14Days'
  | 'completed30Days'
  | 'eventsWithAlerts'
  | 'atRiskProjects'

export interface PersonaKpiConfig {
  readonly id: string
  readonly label: string
  readonly metric: PlannerPersonaMetricKey
  readonly hint?: string
  readonly prefix?: string
  readonly suffix?: string
}

export interface PersonaPreset {
  readonly label: string
  readonly description?: string
  readonly statusFilter?: StatusFilter
  readonly riskFilter?: RiskFilter
  readonly sortKey?: SortKey
  readonly sortDir?: SortDirection
  readonly timeFilter?: TimeFilter
  readonly searchTerm?: string
  readonly kpis?: PersonaKpiConfig[]
}

export type PersonaKey = 'all' | 'operations' | 'support' | 'cfo' | 'sales' | 'compliance'
