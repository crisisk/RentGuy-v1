export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost' | (string & {})

export interface LeadBase {
  readonly name: string
  readonly email?: string | null
  readonly phone?: string | null
  readonly source?: string | null
  readonly status?: LeadStatus
}

export interface LeadCreatePayload extends LeadBase {
  readonly externalId?: string | null
}

export interface Lead extends Required<Pick<LeadBase, 'name'>> {
  readonly id: number
  readonly name: string
  readonly email?: string | null
  readonly phone?: string | null
  readonly source?: string | null
  readonly status: LeadStatus
  readonly externalId?: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface LeadCaptureSubmission {
  readonly tenant: string
  readonly firstName: string
  readonly lastName: string
  readonly email: string
  readonly phone?: string | null
  readonly source?: string | null
  readonly marketingOptIn?: boolean
  readonly message?: string | null
  readonly captchaToken: string
  readonly utmSource?: string | null
  readonly utmMedium?: string | null
  readonly utmCampaign?: string | null
}

export interface LeadCaptureResponse {
  readonly leadId: number
  readonly status: string
  readonly automationTriggered: boolean
}

export interface PipelineStage {
  readonly id: number
  readonly name: string
  readonly order: number
  readonly automationFlow?: string | null
}

export interface DealBase {
  readonly title: string
  readonly leadId?: number | null
  readonly pipelineId: number
  readonly stageId: number
  readonly value?: number
  readonly currency?: string
  readonly expectedClose?: string | null
  readonly probability?: number
}

export interface DealCreatePayload extends DealBase {}

export interface DealStageUpdatePayload {
  readonly stageId: number
}

export interface Deal extends DealBase {
  readonly id: number
  readonly value: number
  readonly currency: string
  readonly expectedClose?: string | null
  readonly probability: number
  readonly status: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly stage: PipelineStage
}

export interface ActivityCreatePayload {
  readonly dealId: number
  readonly activityType: string
  readonly summary: string
  readonly payload?: string | null
  readonly occurredAt?: string | null
}

export interface Activity {
  readonly id: number
  readonly activityType: string
  readonly summary: string
  readonly payload?: string | null
  readonly occurredAt: string
  readonly createdAt: string
}

export interface AutomationRun {
  readonly id: number
  readonly trigger: string
  readonly workflowId: string
  readonly status: string
  readonly createdAt: string
  readonly completedAt?: string | null
}

export interface DashboardHeadlineKPIs {
  readonly totalPipelineValue: number
  readonly weightedPipelineValue: number
  readonly wonValueLast30Days: number
  readonly avgDealCycleDays?: number | null
  readonly automationFailureRate: number
  readonly activeWorkflows: number
}

export interface DashboardLeadFunnelKPIs {
  readonly totalLeads: number
  readonly leadsLast30Days: number
  readonly leadsWithDeals: number
  readonly conversionRate: number
}

export interface PipelineStageMetric {
  readonly stageId: number
  readonly stageName: string
  readonly dealCount: number
  readonly totalValue: number
  readonly weightedValue: number
  readonly avgAgeDays?: number | null
}

export interface AutomationWorkflowMetric {
  readonly workflowId: string
  readonly runCount: number
  readonly failedRuns: number
  readonly avgCompletionMinutes?: number | null
  readonly slaBreaches: number
  readonly failureRate: number
}

export interface SalesPerformanceKPIs {
  readonly openDeals: number
  readonly wonDealsLast30Days: number
  readonly lostDealsLast30Days: number
  readonly totalDeals: number
  readonly bookingsLast30Days: number
  readonly winRate: number
  readonly avgDealValue?: number | null
  readonly forecastNext30Days: number
  readonly pipelineVelocityPerDay: number
}

export interface AcquisitionPerformanceKPIs {
  readonly lookbackDays: number
  readonly gaSessions: number
  readonly gaNewUsers: number
  readonly gaEngagedSessions: number
  readonly gaConversions: number
  readonly gaConversionValue: number
  readonly gtmConversions: number
  readonly gtmConversionValue: number
  readonly blendedConversionRate: number
  readonly activeConnectors: string[]
}

export interface SourcePerformanceMetric {
  readonly key: string
  readonly label: string
  readonly dimensionType: string
  readonly leadCount: number
  readonly dealCount: number
  readonly wonDealCount: number
  readonly pipelineValue: number
  readonly wonValue: number
  readonly gaSessions: number
  readonly gaConversions: number
  readonly gtmConversions: number
  readonly gaRevenue: number
  readonly gtmRevenue: number
}

export interface DashboardProvenance {
  readonly source: string
  readonly upstreamSystems: string[]
  readonly lastRefreshedAt?: string | null
}

export interface CRMDashboardSummary {
  readonly generatedAt: string
  readonly headline: DashboardHeadlineKPIs
  readonly leadFunnel: DashboardLeadFunnelKPIs
  readonly pipeline: PipelineStageMetric[]
  readonly automation: AutomationWorkflowMetric[]
  readonly sales: SalesPerformanceKPIs
  readonly acquisition: AcquisitionPerformanceKPIs
  readonly sourcePerformance: SourcePerformanceMetric[]
  readonly provenance: DashboardProvenance
}
