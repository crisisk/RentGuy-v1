export enum CustomerStatus {
  LEAD = 'LEAD',
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  address?: Address
  status: CustomerStatus
  createdAt: string
}

export interface Contact {
  id: string
  customerId: string
  name: string
  email: string
  phone: string
  position?: string
  isPrimary: boolean
}

export interface Activity {
  id: string
  customerId: string
  type: ActivityType
  description: string
  date: string
  userId: string
}

export interface CustomerTimelineEntry {
  id: string
  customerId: string
  occurredAt: string
  summary: string
  activityType: ActivityType
  metadata?: Record<string, unknown>
}

export interface CustomerSegment {
  id: string
  name: string
  description?: string
  status: CustomerStatus
  size: number
}

export type CustomerWithContacts = Customer & { contacts: Contact[] }

export interface DashboardHeadlineKPIs {
  totalPipelineValue: number
  weightedPipelineValue: number
  wonValueLast30Days: number
  avgDealCycleDays?: number | null
  automationFailureRate: number
  activeWorkflows: number
}

export interface DashboardLeadFunnelKPIs {
  totalLeads: number
  leadsLast30Days: number
  leadsWithDeals: number
  conversionRate: number
}

export interface PipelineStageMetric {
  stageId: number
  stageName: string
  dealCount: number
  totalValue: number
  weightedValue: number
  avgAgeDays?: number | null
}

export interface AutomationWorkflowMetric {
  workflowId: string
  runCount: number
  failedRuns: number
  avgCompletionMinutes?: number | null
  slaBreaches: number
  failureRate: number
}

export interface SalesPerformanceKPIs {
  openDeals: number
  wonDealsLast30Days: number
  lostDealsLast30Days: number
  totalDeals: number
  bookingsLast30Days: number
  winRate: number
  avgDealValue?: number | null
  forecastNext30Days: number
  pipelineVelocityPerDay: number
}

export interface AcquisitionPerformanceKPIs {
  lookbackDays: number
  gaSessions: number
  gaNewUsers: number
  gaEngagedSessions: number
  gaConversions: number
  gaConversionValue: number
  gtmConversions: number
  gtmConversionValue: number
  blendedConversionRate: number
  activeConnectors: string[]
}

export interface SourcePerformanceMetric {
  key: string
  label: string
  dimensionType: string
  leadCount: number
  dealCount: number
  wonDealCount: number
  pipelineValue: number
  wonValue: number
  gaSessions: number
  gaConversions: number
  gtmConversions: number
  gaRevenue: number
  gtmRevenue: number
}

export interface DashboardProvenance {
  source: string
  upstreamSystems: string[]
  lastRefreshedAt?: string | null
}

export interface CRMDashboardSummary {
  generatedAt: string
  headline: DashboardHeadlineKPIs
  leadFunnel: DashboardLeadFunnelKPIs
  pipeline: PipelineStageMetric[]
  automation: AutomationWorkflowMetric[]
  sales: SalesPerformanceKPIs
  acquisition: AcquisitionPerformanceKPIs
  sourcePerformance: SourcePerformanceMetric[]
  provenance: DashboardProvenance
}
