export type ProjectStatus = 'upcoming' | 'active' | 'completed' | 'at_risk'

export type InventoryRiskLevel = 'ok' | 'warning' | 'critical'
export type RiskLevel = InventoryRiskLevel

export type StatusFilter = 'all' | ProjectStatus
export type RiskFilter = 'all' | InventoryRiskLevel
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
  | 'operations'
  | 'support'
  | 'cfo'
  | 'compliance'
  | 'sales'

export interface PersonaKpiConfig {
  readonly id: string
  readonly label: string
  readonly metric: string
  readonly prefix?: string
  readonly suffix?: string
  readonly hint?: string
}

export interface PersonaPreset {
  readonly label: string
  readonly description?: string
  readonly statusFilter?: StatusFilter
  readonly riskFilter?: RiskFilter
  readonly timeFilter?: TimeFilter
  readonly sortKey?: SortKey
  readonly sortDir?: SortDirection
  readonly searchTerm?: string
  readonly kpis?: PersonaKpiConfig[]
}

export interface ProjectInput {
  readonly name: string
  readonly clientName: string
  readonly startDate: string
  readonly endDate: string
  readonly notes?: string
}

export interface Project {
  readonly id: number
  readonly name: string
  readonly clientName: string
  readonly startDate: string
  readonly endDate: string
  readonly notes: string
  readonly status?: ProjectStatus | null
  readonly daysUntilStart?: number | null
  readonly durationDays?: number | null
  readonly inventoryRisk?: InventoryRiskLevel | null
  readonly inventoryAlerts?: string[] | null
}

export interface ReserveItemInput {
  readonly itemId: number
  readonly qty: number
}

export interface ReserveRequestPayload {
  readonly items: ReserveItemInput[]
}

export interface ProjectItem {
  readonly id: number
  readonly projectId: number
  readonly itemId: number
  readonly qtyReserved: number
}

export interface ProjectDetail {
  readonly project: Project
  readonly items: ProjectItem[]
}

export interface PlannerProjectDto {
  readonly id: number
  readonly name: string
  readonly client_name: string
  readonly start_date?: string | null
  readonly end_date?: string | null
  readonly status?: ProjectStatus | null
  readonly inventory_risk?: InventoryRiskLevel | null
  readonly inventory_alerts?: string[] | null
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
  readonly risk: InventoryRiskLevel
  readonly alerts: string[]
  readonly durationDays: number | null
  readonly daysUntilStart: number | null
  readonly notes: string
}
