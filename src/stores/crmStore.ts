import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
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

export type CustomerStatus = 'active' | 'pending' | 'inactive' | 'archived'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  status: CustomerStatus
  createdAt: string
  address: string
  company?: string
  notes?: string
}

export interface CustomerInput extends Omit<Customer, 'id' | 'createdAt'> {
  id?: string
}

export interface Activity {
  id: string
  customerId: string
  type: string
  description: string
  date: string
  owner?: string
}

interface CRMState {
  customers: Customer[]
  customerMap: Record<string, Customer>
  customerActivities: Record<string, Activity[]>
  activityLog: Activity[]
  dashboard: CRMDashboardSummary | null
  loading: boolean
  error: string | null
  clearError: () => void
  loadCustomers: () => Promise<Customer[]>
  fetchCustomers: () => Promise<Customer[]>
  getCustomerById: (id: string) => Promise<Customer | null>
  getCustomer: (id: string) => Promise<Customer | null>
  createCustomer: (customer: CustomerInput) => Promise<Customer>
  updateCustomer: (customer: CustomerInput & { id: string }) => Promise<Customer>
  saveCustomer: (customer: CustomerInput) => Promise<Customer>
  deleteCustomer: (customerId: string) => Promise<void>
  fetchActivities: (customerId?: string) => Promise<Activity[]>
  getCustomerActivities: (customerId: string) => Promise<Activity[]>
  getActivityLog: () => Promise<Activity[]>
  createActivity: (activity: Omit<Activity, 'id'> & { id?: string }) => Promise<Activity>
  fetchDashboardSummary: (options?: { lookbackDays?: number }) => Promise<CRMDashboardSummary>
}

const CRM_BASE_PATH = '/api/v1/crm'
const CRM_ANALYTICS_PATH = `${CRM_BASE_PATH}/analytics/dashboard`

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message
}

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

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

const DEFAULT_FALLBACK_DATE = new Date('1970-01-01T00:00:00.000Z')

const toIsoString = (value: unknown, fallback: Date = DEFAULT_FALLBACK_DATE): string => {
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

function mapCustomer(payload: any): Customer {
  const id = String(payload?.id ?? payload?.customerId ?? generateId())
  const createdAt = toIsoString(payload?.createdAt ?? payload?.created_at ?? Date.now())
  const statusCandidate = (payload?.status ?? 'active') as CustomerStatus
  const status: CustomerStatus =
    statusCandidate === 'pending' ||
    statusCandidate === 'inactive' ||
    statusCandidate === 'archived'
      ? statusCandidate
      : 'active'

  const customer: Customer = {
    id,
    name: toStringSafe(payload?.name, 'Onbekende klant'),
    email: toStringSafe(payload?.email, ''),
    phone: toStringSafe(payload?.phone ?? payload?.phoneNumber ?? ''),
    status,
    createdAt,
    address: toStringSafe(payload?.address ?? payload?.companyAddress ?? ''),
  }

  if (payload?.company) {
    customer.company = String(payload.company)
  }
  if (payload?.notes) {
    customer.notes = String(payload.notes)
  }

  return customer
}

function mapActivity(payload: any): Activity {
  const id = String(payload?.id ?? generateId())
  const customerId = String(payload?.customerId ?? payload?.customer_id ?? '')
  const activity: Activity = {
    id,
    customerId,
    type: toStringSafe(payload?.type ?? payload?.category ?? 'activity'),
    description: toStringSafe(payload?.description ?? payload?.details ?? ''),
    date: toIsoString(payload?.date ?? payload?.occurred_at ?? Date.now()),
  }

  if (payload?.owner) {
    activity.owner = String(payload.owner)
  }

  return activity
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

const useCRMStoreBase = create<CRMState>()(
  immer((set, get) => ({
    customers: [],
    customerMap: {},
    customerActivities: {},
    activityLog: [],
    dashboard: null,
    loading: false,
    error: null,

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    loadCustomers: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${CRM_BASE_PATH}/customers`)
        const customers = Array.isArray(response.data) ? response.data.map(mapCustomer) : []

        set((state) => {
          state.customers = customers
          state.customerMap = customers.reduce<Record<string, Customer>>((acc, customer) => {
            acc[customer.id] = customer
            return acc
          }, {})
          state.loading = false
        })

        return customers
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    fetchCustomers: () => get().loadCustomers(),

    getCustomerById: async (id: string) => {
      const cached = get().customerMap[id]
      if (cached) {
        return cached
      }

      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${CRM_BASE_PATH}/customers/${id}`)
        const customer = mapCustomer(response.data)

        set((state) => {
          state.customerMap[customer.id] = customer
          const existingIndex = state.customers.findIndex((item) => item.id === customer.id)
          if (existingIndex >= 0) {
            state.customers[existingIndex] = customer
          } else {
            state.customers.push(customer)
          }
          state.loading = false
        })

        return customer
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        return null
      }
    },

    getCustomer: (id: string) => get().getCustomerById(id),

    createCustomer: async (customerInput) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(`${CRM_BASE_PATH}/customers`, customerInput)
        const customer = mapCustomer({ ...customerInput, ...response.data })
        set((state) => {
          state.customers.push(customer)
          state.customerMap[customer.id] = customer
          state.loading = false
        })
        return customer
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    updateCustomer: async (customerInput) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.put(
          `${CRM_BASE_PATH}/customers/${customerInput.id}`,
          customerInput,
        )
        const customer = mapCustomer({ ...customerInput, ...response.data })
        set((state) => {
          state.customerMap[customer.id] = customer
          state.customers = state.customers.map((existing) =>
            existing.id === customer.id ? customer : existing,
          )
          state.loading = false
        })
        return customer
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    saveCustomer: async (customerInput) => {
      if (customerInput.id) {
        return get().updateCustomer({ ...customerInput, id: customerInput.id })
      }
      return get().createCustomer(customerInput)
    },

    deleteCustomer: async (customerId) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        await api.delete(`${CRM_BASE_PATH}/customers/${customerId}`)
        set((state) => {
          delete state.customerMap[customerId]
          state.customers = state.customers.filter((customer) => customer.id !== customerId)
          delete state.customerActivities[customerId]
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    fetchActivities: async (customerId) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const url = customerId
          ? `${CRM_BASE_PATH}/customers/${customerId}/activities`
          : `${CRM_BASE_PATH}/activities`
        const response = await api.get(url)
        const activities = Array.isArray(response.data) ? response.data.map(mapActivity) : []

        set((state) => {
          if (customerId) {
            state.customerActivities[customerId] = activities
          } else {
            state.activityLog = activities
          }
          state.loading = false
        })

        return activities
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    getCustomerActivities: async (customerId) => {
      const cached = get().customerActivities[customerId]
      if (Array.isArray(cached)) {
        return cached
      }

      try {
        return await get().fetchActivities(customerId)
      } catch {
        return []
      }
    },

    getActivityLog: async () => {
      if (Array.isArray(get().activityLog) && get().activityLog.length > 0) {
        return get().activityLog
      }

      try {
        return await get().fetchActivities()
      } catch {
        return []
      }
    },

    createActivity: async (activityInput) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(`${CRM_BASE_PATH}/activities`, activityInput)
        const activity = mapActivity({ ...activityInput, ...response.data })
        set((state) => {
          const list = state.customerActivities[activity.customerId] ?? []
          list.push(activity)
          state.customerActivities[activity.customerId] = list
          state.activityLog.unshift(activity)
          state.loading = false
        })
        return activity
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    fetchDashboardSummary: async (options) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const config: Record<string, unknown> = {}
        if (options && typeof options.lookbackDays === 'number') {
          config.params = { lookback_days: options.lookbackDays }
        }

        const response = await api.get(CRM_ANALYTICS_PATH, config)
        const summary = mapDashboardSummary(response.data)

        set((state) => {
          state.dashboard = summary
          state.loading = false
        })

        return summary
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },
  })),
)

const crmStore = Object.assign(useCRMStoreBase, {
  clearError: () => useCRMStoreBase.getState().clearError(),
  loadCustomers: () => useCRMStoreBase.getState().loadCustomers(),
  fetchCustomers: () => useCRMStoreBase.getState().fetchCustomers(),
  getCustomerById: (id: string) => useCRMStoreBase.getState().getCustomerById(id),
  getCustomer: (id: string) => useCRMStoreBase.getState().getCustomer(id),
  createCustomer: (customer: CustomerInput) => useCRMStoreBase.getState().createCustomer(customer),
  updateCustomer: (customer: CustomerInput & { id: string }) =>
    useCRMStoreBase.getState().updateCustomer(customer),
  saveCustomer: (customer: CustomerInput) => useCRMStoreBase.getState().saveCustomer(customer),
  deleteCustomer: (customerId: string) => useCRMStoreBase.getState().deleteCustomer(customerId),
  fetchActivities: (customerId?: string) => useCRMStoreBase.getState().fetchActivities(customerId),
  getCustomerActivities: (customerId: string) =>
    useCRMStoreBase.getState().getCustomerActivities(customerId),
  getActivityLog: () => useCRMStoreBase.getState().getActivityLog(),
  createActivity: (activity: Omit<Activity, 'id'> & { id?: string }) =>
    useCRMStoreBase.getState().createActivity(activity),
  fetchDashboardSummary: (options?: { lookbackDays?: number }) =>
    useCRMStoreBase.getState().fetchDashboardSummary(options),
})

export default crmStore
