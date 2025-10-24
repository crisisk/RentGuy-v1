import create from 'zustand'
import { produce } from 'immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'
import type {
  CRMDashboardSummary,
  DashboardHeadlineKPIs,
  DashboardLeadFunnelKPIs,
  AutomationWorkflowMetric,
  PipelineStageMetric,
  SalesPerformanceKPIs,
  AcquisitionPerformanceKPIs,
  SourcePerformanceMetric,
  DashboardProvenance,
} from '@rg-types/crmTypes'
export interface Customer {
  id?: number
  name: string
  email: string
  phone?: string
  notes?: string
}
export interface Activity {
  id?: number
  customerId: number
  type: string
  description: string
  date: string
}
export interface CRMState {
  customers: Customer[]
  activities: Activity[]
  loading: boolean
  error: string | null
  dashboard: CRMDashboardSummary | null
  fetchCustomers: () => Promise<void>
  createCustomer: (customer: Customer) => Promise<void>
  updateCustomer: (customer: Customer) => Promise<void>
  deleteCustomer: (customerId: number) => Promise<void>
  fetchActivities: (customerId?: number) => Promise<void>
  createActivity: (activity: Activity) => Promise<void>
  fetchDashboardSummary: (options?: { lookbackDays?: number }) => Promise<CRMDashboardSummary>
}
const CRM_BASE_PATH = '/api/v1/crm'
const CRM_ANALYTICS_PATH = `${CRM_BASE_PATH}/analytics/dashboard`

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

const toInteger = (value: unknown, fallback = 0): number => {
  const numeric = toNumber(value, fallback)
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  const numeric = toNumber(value, Number.NaN)
  return Number.isFinite(numeric) ? numeric : null
}

const toStringSafe = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) {
    return fallback
  }
  const result = String(value)
  return result.length > 0 ? result : fallback
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []

const toIsoString = (value: unknown, fallback: Date = new Date()): string => {
  if (value) {
    const date = new Date(value as string | number | Date)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return fallback.toISOString()
}

const toIsoStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const mapHeadline = (payload: any): DashboardHeadlineKPIs => ({
  totalPipelineValue: toNumber(payload?.total_pipeline_value ?? payload?.totalPipelineValue),
  weightedPipelineValue: toNumber(
    payload?.weighted_pipeline_value ?? payload?.weightedPipelineValue,
  ),
  wonValueLast30Days: toNumber(payload?.won_value_last_30_days ?? payload?.wonValueLast30Days),
  avgDealCycleDays: toNullableNumber(payload?.avg_deal_cycle_days ?? payload?.avgDealCycleDays),
  automationFailureRate: toNumber(
    payload?.automation_failure_rate ?? payload?.automationFailureRate,
  ),
  activeWorkflows: toInteger(payload?.active_workflows ?? payload?.activeWorkflows),
})

const mapLeadFunnel = (payload: any): DashboardLeadFunnelKPIs => ({
  totalLeads: toInteger(payload?.total_leads ?? payload?.totalLeads),
  leadsLast30Days: toInteger(payload?.leads_last_30_days ?? payload?.leadsLast30Days),
  leadsWithDeals: toInteger(payload?.leads_with_deals ?? payload?.leadsWithDeals),
  conversionRate: toNumber(payload?.conversion_rate ?? payload?.conversionRate),
})

const mapPipelineStage = (payload: any): PipelineStageMetric => ({
  stageId: toInteger(payload?.stage_id ?? payload?.stageId),
  stageName: toStringSafe(payload?.stage_name ?? payload?.stageName, 'Onbekende fase'),
  dealCount: toInteger(payload?.deal_count ?? payload?.dealCount),
  totalValue: toNumber(payload?.total_value ?? payload?.totalValue),
  weightedValue: toNumber(payload?.weighted_value ?? payload?.weightedValue),
  avgAgeDays: toNullableNumber(payload?.avg_age_days ?? payload?.avgAgeDays),
})

const mapAutomationWorkflow = (payload: any): AutomationWorkflowMetric => ({
  workflowId: toStringSafe(payload?.workflow_id ?? payload?.workflowId, 'unknown'),
  runCount: toInteger(payload?.run_count ?? payload?.runCount),
  failedRuns: toInteger(payload?.failed_runs ?? payload?.failedRuns),
  avgCompletionMinutes: toNullableNumber(
    payload?.avg_completion_minutes ?? payload?.avgCompletionMinutes,
  ),
  slaBreaches: toInteger(payload?.sla_breaches ?? payload?.slaBreaches),
  failureRate: toNumber(payload?.failure_rate ?? payload?.failureRate),
})

const mapSalesMetrics = (payload: any): SalesPerformanceKPIs => ({
  openDeals: toInteger(payload?.open_deals ?? payload?.openDeals),
  wonDealsLast30Days: toInteger(payload?.won_deals_last_30_days ?? payload?.wonDealsLast30Days),
  lostDealsLast30Days: toInteger(payload?.lost_deals_last_30_days ?? payload?.lostDealsLast30Days),
  totalDeals: toInteger(payload?.total_deals ?? payload?.totalDeals),
  bookingsLast30Days: toInteger(payload?.bookings_last_30_days ?? payload?.bookingsLast30Days),
  winRate: toNumber(payload?.win_rate ?? payload?.winRate),
  avgDealValue: toNullableNumber(payload?.avg_deal_value ?? payload?.avgDealValue),
  forecastNext30Days: toNumber(payload?.forecast_next_30_days ?? payload?.forecastNext30Days),
  pipelineVelocityPerDay: toNumber(
    payload?.pipeline_velocity_per_day ?? payload?.pipelineVelocityPerDay,
  ),
})

const mapAcquisitionMetrics = (payload: any): AcquisitionPerformanceKPIs => ({
  lookbackDays: toInteger(payload?.lookback_days ?? payload?.lookbackDays),
  gaSessions: toInteger(payload?.ga_sessions ?? payload?.gaSessions),
  gaNewUsers: toInteger(payload?.ga_new_users ?? payload?.gaNewUsers),
  gaEngagedSessions: toInteger(payload?.ga_engaged_sessions ?? payload?.gaEngagedSessions),
  gaConversions: toInteger(payload?.ga_conversions ?? payload?.gaConversions),
  gaConversionValue: toNumber(payload?.ga_conversion_value ?? payload?.gaConversionValue),
  gtmConversions: toInteger(payload?.gtm_conversions ?? payload?.gtmConversions),
  gtmConversionValue: toNumber(payload?.gtm_conversion_value ?? payload?.gtmConversionValue),
  blendedConversionRate: toNumber(
    payload?.blended_conversion_rate ?? payload?.blendedConversionRate,
  ),
  activeConnectors: toStringArray(payload?.active_connectors ?? payload?.activeConnectors),
})

const mapSourcePerformance = (payload: any): SourcePerformanceMetric => ({
  key: toStringSafe(payload?.key ?? payload?.id ?? ''),
  label: toStringSafe(payload?.label ?? 'Onbekende bron'),
  dimensionType: toStringSafe(payload?.dimension_type ?? payload?.dimensionType ?? 'unknown'),
  leadCount: toInteger(payload?.lead_count ?? payload?.leadCount),
  dealCount: toInteger(payload?.deal_count ?? payload?.dealCount),
  wonDealCount: toInteger(payload?.won_deal_count ?? payload?.wonDealCount),
  pipelineValue: toNumber(payload?.pipeline_value ?? payload?.pipelineValue),
  wonValue: toNumber(payload?.won_value ?? payload?.wonValue),
  gaSessions: toInteger(payload?.ga_sessions ?? payload?.gaSessions),
  gaConversions: toInteger(payload?.ga_conversions ?? payload?.gaConversions),
  gtmConversions: toInteger(payload?.gtm_conversions ?? payload?.gtmConversions),
  gaRevenue: toNumber(payload?.ga_revenue ?? payload?.gaRevenue),
  gtmRevenue: toNumber(payload?.gtm_revenue ?? payload?.gtmRevenue),
})

const mapProvenance = (payload: any): DashboardProvenance => ({
  source: toStringSafe(payload?.source ?? 'unknown'),
  upstreamSystems: toStringArray(payload?.upstream_systems ?? payload?.upstreamSystems),
  lastRefreshedAt: toIsoStringOrNull(payload?.last_refreshed_at ?? payload?.lastRefreshedAt),
})

const mapDashboardSummary = (payload: any): CRMDashboardSummary => ({
  generatedAt: toIsoString(payload?.generated_at ?? payload?.generatedAt),
  headline: mapHeadline(payload?.headline ?? {}),
  leadFunnel: mapLeadFunnel(payload?.lead_funnel ?? payload?.leadFunnel ?? {}),
  pipeline: Array.isArray(payload?.pipeline)
    ? (payload.pipeline as any[]).map(mapPipelineStage)
    : [],
  automation: Array.isArray(payload?.automation)
    ? (payload.automation as any[]).map(mapAutomationWorkflow)
    : [],
  sales: mapSalesMetrics(payload?.sales ?? {}),
  acquisition: mapAcquisitionMetrics(payload?.acquisition ?? {}),
  sourcePerformance: Array.isArray(payload?.source_performance ?? payload?.sourcePerformance)
    ? ((payload?.source_performance ?? payload?.sourcePerformance) as any[]).map(
        mapSourcePerformance,
      )
    : [],
  provenance: mapProvenance(payload?.provenance ?? {}),
})

export const crmStore = create<CRMState>((set) => ({
  customers: [],
  activities: [],
  loading: false,
  error: null,
  dashboard: null,
  fetchCustomers: async () => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )
    try {
      const response = await api.get(`${CRM_BASE_PATH}/customers`)
      set(
        produce((state) => {
          state.customers = Array.isArray(response.data) ? response.data : []
          state.loading = false
        }),
      )
    } catch (error) {
      set(
        produce((state) => {
          state.error = resolveError(error)
          state.loading = false
        }),
      )
    }
  },
  createCustomer: async (customer) => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )
    try {
      const response = await api.post(`${CRM_BASE_PATH}/customers`, customer)
      set(
        produce((state) => {
          if (response.data) {
            state.customers.push(response.data as Customer)
          }
          state.loading = false
        }),
      )
    } catch (error) {
      set(
        produce((state) => {
          state.error = resolveError(error)
          state.loading = false
        }),
      )
    }
  },
  updateCustomer: async (customer) => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )
    try {
      const response = await api.put(`${CRM_BASE_PATH}/customers/${customer.id}`, customer)
      set(
        produce((state) => {
          const index = state.customers.findIndex((c) => c.id === customer.id)
          if (index !== -1 && response.data) state.customers[index] = response.data as Customer
          state.loading = false
        }),
      )
    } catch (error) {
      set(
        produce((state) => {
          state.error = resolveError(error)
          state.loading = false
        }),
      )
    }
  },
  deleteCustomer: async (customerId) => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )
    try {
      await api.delete(`${CRM_BASE_PATH}/customers/${customerId}`)
      set(
        produce((state) => {
          state.customers = state.customers.filter((c) => c.id !== customerId)
          state.loading = false
        }),
      )
    } catch (error) {
      set(
        produce((state) => {
          state.error = resolveError(error)
          state.loading = false
        }),
      )
    }
  },
  fetchActivities: async (customerId) => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )
    try {
      const url = customerId
        ? `${CRM_BASE_PATH}/activities?customerId=${customerId}`
        : `${CRM_BASE_PATH}/activities`
      const response = await api.get(url)
      set(
        produce((state) => {
          state.activities = Array.isArray(response.data) ? response.data : []
          state.loading = false
        }),
      )
    } catch (error) {
      set(
        produce((state) => {
          state.error = resolveError(error)
          state.loading = false
        }),
      )
    }
  },
  createActivity: async (activity) => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )
    try {
      const response = await api.post(`${CRM_BASE_PATH}/activities`, activity)
      set(
        produce((state) => {
          if (response.data) {
            state.activities.push(response.data as Activity)
          }
          state.loading = false
        }),
      )
    } catch (error) {
      set(
        produce((state) => {
          state.error = resolveError(error)
          state.loading = false
        }),
      )
    }
  },
  fetchDashboardSummary: async (options) => {
    set(
      produce((state) => {
        state.loading = true
        state.error = null
      }),
    )

    try {
      const response = await api.get(CRM_ANALYTICS_PATH, {
        params: options?.lookbackDays ? { lookback_days: options.lookbackDays } : undefined,
      })
      const summary = mapDashboardSummary(response.data)

      set(
        produce((state) => {
          state.dashboard = summary
          state.loading = false
        }),
      )

      return summary
    } catch (error) {
      const message = resolveError(error)
      set(
        produce((state) => {
          state.error = message
          state.loading = false
        }),
      )
      throw new Error(message)
    }
  },
}))
export default crmStore
