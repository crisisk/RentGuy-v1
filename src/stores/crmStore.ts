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

export type CustomerStatus = 'active' | 'inactive'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: CustomerStatus
  company: string
  createdAt: string
  notes?: string
}

export interface CustomerInput extends Partial<Omit<Customer, 'id' | 'createdAt'>> {
  id?: string
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note'

export interface Activity {
  id: string
  customerId: string
  type: ActivityType
  description: string
  timestamp: string
  date: string
  user: string
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
  createCustomer: (input: CustomerInput) => Promise<Customer>
  updateCustomer: (input: CustomerInput & { id: string }) => Promise<Customer>
  saveCustomer: (input: CustomerInput) => Promise<Customer>
  deleteCustomer: (customerId: string) => Promise<void>
  fetchActivities: (customerId?: string) => Promise<Activity[]>
  getCustomerActivities: (customerId: string) => Promise<Activity[]>
  getActivityLog: () => Promise<Activity[]>
  createActivity: (
    input: Omit<Activity, 'id' | 'date' | 'timestamp'> & { occurredAt?: string },
  ) => Promise<Activity>
  fetchDashboardSummary: (options?: { lookbackDays?: number }) => Promise<CRMDashboardSummary>
}

const CRM_BASE_PATH = '/api/v1/crm'
const CUSTOMERS_PATH = `${CRM_BASE_PATH}/customers`
const ACTIVITIES_PATH = `${CRM_BASE_PATH}/activities`
const DASHBOARD_PATH = `${CRM_BASE_PATH}/analytics/dashboard`

const EMPTY_DASHBOARD: CRMDashboardSummary = {
  generatedAt: new Date(0).toISOString(),
  headline: {
    totalPipelineValue: 0,
    weightedPipelineValue: 0,
    wonValueLast30Days: 0,
    avgDealCycleDays: null,
    automationFailureRate: 0,
    activeWorkflows: 0,
  },
  leadFunnel: {
    totalLeads: 0,
    leadsLast30Days: 0,
    leadsWithDeals: 0,
    conversionRate: 0,
  },
  pipeline: [],
  automation: [],
  sales: {
    openDeals: 0,
    wonDealsLast30Days: 0,
    lostDealsLast30Days: 0,
    totalDeals: 0,
    bookingsLast30Days: 0,
    winRate: 0,
    avgDealValue: null,
    forecastNext30Days: 0,
    pipelineVelocityPerDay: 0,
  },
  acquisition: {
    lookbackDays: 30,
    gaSessions: 0,
    gaNewUsers: 0,
    gaEngagedSessions: 0,
    gaConversions: 0,
    gaConversionValue: 0,
    gtmConversions: 0,
    gtmConversionValue: 0,
    blendedConversionRate: 0,
    activeConnectors: [],
  },
  sourcePerformance: [],
  provenance: {
    source: 'unknown',
    upstreamSystems: [],
    lastRefreshedAt: null,
  },
}

function resolveError(error: unknown, fallback: string): string {
  const mapped = mapUnknownToApiError(error)
  return mapped.message || fallback
}

function toStringSafe(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return fallback
}

function toCustomerStatus(value: unknown): CustomerStatus {
  if (value === 'inactive') {
    return 'inactive'
  }
  return 'active'
}

function toDateString(value: unknown, fallback: Date = new Date()): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }
  return fallback.toISOString()
}

function createCustomerFromPayload(payload: unknown): Customer | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? record.customerId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const name = record.name ?? record.fullName
  const email = record.email ?? record.contactEmail
  const phone = record.phone ?? record.phoneNumber
  const address = record.address ?? record.streetAddress
  const company = record.company ?? record.organisation ?? 'Onbekend'

  if (!name || !email) {
    return null
  }

  const customer: Customer = {
    id: toStringSafe(id),
    name: toStringSafe(name, 'Onbekende klant'),
    email: toStringSafe(email),
    phone: toStringSafe(phone),
    address: toStringSafe(address),
    company: toStringSafe(company, 'Onbekend'),
    status: toCustomerStatus(record.status),
    createdAt: toDateString(record.createdAt ?? record.created_at ?? Date.now()),
  }

  const notesValue = record.notes ? toStringSafe(record.notes) : ''
  if (notesValue) {
    customer.notes = notesValue
  }

  return customer
}

function createActivityFromPayload(payload: unknown): Activity | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const customerId = record.customerId ?? record.customer_id
  const type = record.type ?? record.activityType ?? 'note'
  const description = record.description ?? record.summary ?? ''
  const occurredAt =
    record.timestamp ?? record.date ?? record.occurredAt ?? record.occurred_at ?? Date.now()
  const user = record.user ?? record.owner ?? 'System'

  if (!customerId) {
    return null
  }

  const iso = toDateString(occurredAt)

  return {
    id: toStringSafe(id),
    customerId: toStringSafe(customerId),
    type: ['call', 'email', 'meeting', 'note'].includes(String(type))
      ? (String(type) as ActivityType)
      : 'note',
    description: toStringSafe(description),
    timestamp: iso,
    date: iso,
    user: toStringSafe(user, 'System'),
  }
}

function coerceHeadline(payload: unknown): DashboardHeadlineKPIs {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DASHBOARD.headline
  }
  const record = payload as Record<string, unknown>
  return {
    totalPipelineValue: Number(record.totalPipelineValue ?? record.total_pipeline_value ?? 0) || 0,
    weightedPipelineValue:
      Number(record.weightedPipelineValue ?? record.weighted_pipeline_value ?? 0) || 0,
    wonValueLast30Days:
      Number(record.wonValueLast30Days ?? record.won_value_last_30_days ?? 0) || 0,
    avgDealCycleDays:
      record.avgDealCycleDays === null || record.avg_deal_cycle_days === null
        ? null
        : Number(record.avgDealCycleDays ?? record.avg_deal_cycle_days ?? 0),
    automationFailureRate:
      Number(record.automationFailureRate ?? record.automation_failure_rate ?? 0) || 0,
    activeWorkflows: Number(record.activeWorkflows ?? record.active_workflows ?? 0) || 0,
  }
}

function coerceLeadFunnel(payload: unknown): DashboardLeadFunnelKPIs {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DASHBOARD.leadFunnel
  }
  const record = payload as Record<string, unknown>
  return {
    totalLeads: Number(record.totalLeads ?? record.total_leads ?? 0) || 0,
    leadsLast30Days: Number(record.leadsLast30Days ?? record.leads_last_30_days ?? 0) || 0,
    leadsWithDeals: Number(record.leadsWithDeals ?? record.leads_with_deals ?? 0) || 0,
    conversionRate: Number(record.conversionRate ?? record.conversion_rate ?? 0) || 0,
  }
}

function coercePipeline(payload: unknown): PipelineStageMetric[] {
  const metrics: PipelineStageMetric[] = []
  if (!Array.isArray(payload)) {
    return metrics
  }

  for (const entry of payload) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const record = entry as Record<string, unknown>
    const avgAgeRaw = record.avgAgeDays ?? record.avg_age_days
    const avgAge =
      avgAgeRaw === null
        ? null
        : avgAgeRaw !== undefined && Number.isFinite(Number(avgAgeRaw))
          ? Number(avgAgeRaw)
          : undefined

    const metric: PipelineStageMetric = {
      stageId: Number(record.stageId ?? record.stage_id ?? 0) || 0,
      stageName: toStringSafe(record.stageName ?? record.stage_name, 'Unknown'),
      dealCount: Number(record.dealCount ?? record.deal_count ?? 0) || 0,
      totalValue: Number(record.totalValue ?? record.total_value ?? 0) || 0,
      weightedValue: Number(record.weightedValue ?? record.weighted_value ?? 0) || 0,
      ...(avgAge !== undefined ? { avgAgeDays: avgAge } : {}),
    }

    metrics.push(metric)
  }

  return metrics
}

function coerceAutomation(payload: unknown): AutomationWorkflowMetric[] {
  const metrics: AutomationWorkflowMetric[] = []
  if (!Array.isArray(payload)) {
    return metrics
  }

  for (const entry of payload) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const record = entry as Record<string, unknown>
    const avgCompletion = record.avgCompletionMinutes ?? record.avg_completion_minutes
    const avgCompletionValue =
      avgCompletion === null
        ? null
        : avgCompletion !== undefined && Number.isFinite(Number(avgCompletion))
          ? Number(avgCompletion)
          : undefined

    const metric: AutomationWorkflowMetric = {
      workflowId: toStringSafe(record.workflowId ?? record.workflow_id, 'workflow'),
      runCount: Number(record.runCount ?? record.run_count ?? 0) || 0,
      failedRuns: Number(record.failedRuns ?? record.failed_runs ?? 0) || 0,
      slaBreaches: Number(record.slaBreaches ?? record.sla_breaches ?? 0) || 0,
      failureRate: Number(record.failureRate ?? record.failure_rate ?? 0) || 0,
      ...(avgCompletionValue !== undefined ? { avgCompletionMinutes: avgCompletionValue } : {}),
    }

    metrics.push(metric)
  }

  return metrics
}

function coerceSales(payload: unknown): SalesPerformanceKPIs {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DASHBOARD.sales
  }
  const record = payload as Record<string, unknown>
  return {
    openDeals: Number(record.openDeals ?? record.open_deals ?? 0) || 0,
    wonDealsLast30Days:
      Number(record.wonDealsLast30Days ?? record.won_deals_last_30_days ?? 0) || 0,
    lostDealsLast30Days:
      Number(record.lostDealsLast30Days ?? record.lost_deals_last_30_days ?? 0) || 0,
    totalDeals: Number(record.totalDeals ?? record.total_deals ?? 0) || 0,
    bookingsLast30Days: Number(record.bookingsLast30Days ?? record.bookings_last_30_days ?? 0) || 0,
    winRate: Number(record.winRate ?? record.win_rate ?? 0) || 0,
    avgDealValue:
      record.avgDealValue === null || record.avg_deal_value === null
        ? null
        : Number(record.avgDealValue ?? record.avg_deal_value ?? 0),
    forecastNext30Days: Number(record.forecastNext30Days ?? record.forecast_next_30_days ?? 0) || 0,
    pipelineVelocityPerDay:
      Number(record.pipelineVelocityPerDay ?? record.pipeline_velocity_per_day ?? 0) || 0,
  }
}

function coerceAcquisition(payload: unknown): AcquisitionPerformanceKPIs {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DASHBOARD.acquisition
  }
  const record = payload as Record<string, unknown>
  return {
    lookbackDays: Number(record.lookbackDays ?? record.lookback_days ?? 30) || 30,
    gaSessions: Number(record.gaSessions ?? record.ga_sessions ?? 0) || 0,
    gaNewUsers: Number(record.gaNewUsers ?? record.ga_new_users ?? 0) || 0,
    gaEngagedSessions: Number(record.gaEngagedSessions ?? record.ga_engaged_sessions ?? 0) || 0,
    gaConversions: Number(record.gaConversions ?? record.ga_conversions ?? 0) || 0,
    gaConversionValue: Number(record.gaConversionValue ?? record.ga_conversion_value ?? 0) || 0,
    gtmConversions: Number(record.gtmConversions ?? record.gtm_conversions ?? 0) || 0,
    gtmConversionValue: Number(record.gtmConversionValue ?? record.gtm_conversion_value ?? 0) || 0,
    blendedConversionRate:
      Number(record.blendedConversionRate ?? record.blended_conversion_rate ?? 0) || 0,
    activeConnectors: (() => {
      const connectors = (record.activeConnectors ?? record.active_connectors) as unknown
      return Array.isArray(connectors)
        ? connectors.filter((item): item is string => typeof item === 'string')
        : []
    })(),
  }
}

function coerceSources(payload: unknown): SourcePerformanceMetric[] {
  const sources: SourcePerformanceMetric[] = []
  if (!Array.isArray(payload)) {
    return sources
  }

  for (const entry of payload) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const record = entry as Record<string, unknown>
    const source: SourcePerformanceMetric = {
      key: toStringSafe(record.key ?? record.id, 'source'),
      label: toStringSafe(record.label ?? record.name, 'Bron'),
      dimensionType: toStringSafe(record.dimensionType ?? record.dimension_type ?? 'channel'),
      leadCount: Number(record.leadCount ?? record.lead_count ?? 0) || 0,
      dealCount: Number(record.dealCount ?? record.deal_count ?? 0) || 0,
      wonDealCount: Number(record.wonDealCount ?? record.won_deal_count ?? 0) || 0,
      pipelineValue: Number(record.pipelineValue ?? record.pipeline_value ?? 0) || 0,
      wonValue: Number(record.wonValue ?? record.won_value ?? 0) || 0,
      gaSessions: Number(record.gaSessions ?? record.ga_sessions ?? 0) || 0,
      gaConversions: Number(record.gaConversions ?? record.ga_conversions ?? 0) || 0,
      gtmConversions: Number(record.gtmConversions ?? record.gtm_conversions ?? 0) || 0,
      gaRevenue: Number(record.gaRevenue ?? record.ga_revenue ?? 0) || 0,
      gtmRevenue: Number(record.gtmRevenue ?? record.gtm_revenue ?? 0) || 0,
    }
    sources.push(source)
  }

  return sources
}

function coerceProvenance(payload: unknown): DashboardProvenance {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DASHBOARD.provenance
  }
  const record = payload as Record<string, unknown>
  const upstream = record.upstreamSystems ?? record.upstream_systems
  return {
    source: toStringSafe(record.source, 'unknown'),
    upstreamSystems: Array.isArray(upstream)
      ? upstream.filter((item: unknown): item is string => typeof item === 'string')
      : [],
    lastRefreshedAt:
      record.lastRefreshedAt === null || record.last_refreshed_at === null
        ? null
        : toDateString(record.lastRefreshedAt ?? record.last_refreshed_at, new Date(0)),
  }
}

function createDashboard(payload: unknown): CRMDashboardSummary {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DASHBOARD
  }
  const record = payload as Record<string, unknown>
  return {
    generatedAt: toDateString(record.generatedAt ?? record.generated_at ?? Date.now()),
    headline: coerceHeadline(record.headline ?? record.headline_kpis),
    leadFunnel: coerceLeadFunnel(record.leadFunnel ?? record.lead_funnel),
    pipeline: coercePipeline(record.pipeline ?? record.pipeline_metrics),
    automation: coerceAutomation(record.automation ?? record.automation_metrics),
    sales: coerceSales(record.sales ?? record.sales_kpis),
    acquisition: coerceAcquisition(record.acquisition ?? record.acquisition_kpis),
    sourcePerformance: coerceSources(record.sourcePerformance ?? record.source_performance),
    provenance: coerceProvenance(record.provenance),
  }
}

export const useCRMStore = create<CRMState>()(
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
      const existing = get().customers
      if (existing.length > 0) {
        return existing
      }
      return get().fetchCustomers()
    },

    fetchCustomers: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(CUSTOMERS_PATH)
        const customers = Array.isArray(response.data)
          ? response.data
              .map(createCustomerFromPayload)
              .filter((customer): customer is Customer => customer !== null)
          : []

        set((state) => {
          state.customers = customers
          state.customerMap = Object.fromEntries(
            customers.map((customer) => [customer.id, customer]),
          )
          state.loading = false
        })

        return customers
      } catch (error) {
        const message = resolveError(error, 'Kon klanten niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getCustomerById: async (id) => {
      const cached = get().customerMap[id]
      if (cached) {
        return cached
      }

      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${CUSTOMERS_PATH}/${id}`)
        const customer = createCustomerFromPayload({ ...response.data, id })
        if (!customer) {
          return null
        }

        set((state) => {
          state.customerMap[customer.id] = customer
          if (!state.customers.find((existing) => existing.id === customer.id)) {
            state.customers.push(customer)
          }
          state.loading = false
        })

        return customer
      } catch (error) {
        const message = resolveError(error, 'Kon klant niet laden')
        set((state) => {
          state.loading = false
          state.error = message
        })
        return null
      }
    },

    getCustomer: async (id) => {
      const customer = get().customerMap[id]
      if (customer) {
        return customer
      }
      return get().getCustomerById(id)
    },

    createCustomer: async (input) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(CUSTOMERS_PATH, input)
        const customer = createCustomerFromPayload({ ...input, ...response.data })
        if (!customer) {
          throw new Error('Onbekend antwoord bij het aanmaken van de klant')
        }

        set((state) => {
          state.customers.push(customer)
          state.customerMap[customer.id] = customer
          state.loading = false
        })

        return customer
      } catch (error) {
        const message = resolveError(error, 'Kon klant niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    updateCustomer: async (input) => {
      const { id, ...rest } = input
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.put(`${CUSTOMERS_PATH}/${id}`, rest)
        const customer = createCustomerFromPayload({ ...rest, ...response.data, id })
        if (!customer) {
          throw new Error('Onbekend antwoord bij het bijwerken van de klant')
        }

        set((state) => {
          state.customerMap[customer.id] = customer
          const index = state.customers.findIndex((existing) => existing.id === customer.id)
          if (index >= 0) {
            state.customers[index] = customer
          } else {
            state.customers.push(customer)
          }
          state.loading = false
        })

        return customer
      } catch (error) {
        const message = resolveError(error, 'Kon klant niet bijwerken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    saveCustomer: async (input) => {
      if (input.id) {
        return get().updateCustomer(input as CustomerInput & { id: string })
      }
      return get().createCustomer(input)
    },

    deleteCustomer: async (customerId) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        await api.delete(`${CUSTOMERS_PATH}/${customerId}`)
        set((state) => {
          state.customers = state.customers.filter((customer) => customer.id !== customerId)
          delete state.customerMap[customerId]
          delete state.customerActivities[customerId]
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error, 'Kon klant niet verwijderen')
        set((state) => {
          state.loading = false
          state.error = message
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
        const endpoint = customerId ? `${CUSTOMERS_PATH}/${customerId}/activities` : ACTIVITIES_PATH
        const response = await api.get(endpoint)
        const activities = Array.isArray(response.data)
          ? response.data
              .map(createActivityFromPayload)
              .filter((activity): activity is Activity => activity !== null)
          : []

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
        const message = resolveError(error, 'Kon activiteiten niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getCustomerActivities: async (customerId) => {
      const existing = get().customerActivities[customerId]
      if (existing) {
        return existing
      }
      return get().fetchActivities(customerId)
    },

    getActivityLog: async () => {
      const { activityLog } = get()
      if (activityLog.length > 0) {
        return activityLog
      }
      return get().fetchActivities()
    },

    createActivity: async (input) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const payload = {
          customerId: input.customerId,
          type: input.type,
          description: input.description,
          occurredAt: input.occurredAt ?? new Date().toISOString(),
          user: input.user,
        }
        const response = await api.post(ACTIVITIES_PATH, payload)
        const activity = createActivityFromPayload({ ...payload, ...response.data })
        if (!activity) {
          throw new Error('Onbekend antwoord bij het aanmaken van de activiteit')
        }

        set((state) => {
          const list = state.customerActivities[activity.customerId]
          if (list) {
            list.unshift(activity)
          } else {
            state.customerActivities[activity.customerId] = [activity]
          }
          state.activityLog.unshift(activity)
          state.loading = false
        })

        return activity
      } catch (error) {
        const message = resolveError(error, 'Kon activiteit niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
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
        const response = options?.lookbackDays
          ? await api.get(DASHBOARD_PATH, { params: { lookbackDays: options.lookbackDays } })
          : await api.get(DASHBOARD_PATH)
        const summary = createDashboard(response.data)

        set((state) => {
          state.dashboard = summary
          state.loading = false
        })

        return summary
      } catch (error) {
        const message = resolveError(error, 'Kon CRM-dashboard niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },
  })),
)

const crmStore = Object.assign(useCRMStore, {
  loadCustomers: () => useCRMStore.getState().loadCustomers(),
  fetchCustomers: () => useCRMStore.getState().fetchCustomers(),
  getCustomerById: (id: string) => useCRMStore.getState().getCustomerById(id),
  getCustomer: (id: string) => useCRMStore.getState().getCustomer(id),
  createCustomer: (input: CustomerInput) => useCRMStore.getState().createCustomer(input),
  updateCustomer: (input: CustomerInput & { id: string }) =>
    useCRMStore.getState().updateCustomer(input),
  saveCustomer: (input: CustomerInput) => useCRMStore.getState().saveCustomer(input),
  deleteCustomer: (customerId: string) => useCRMStore.getState().deleteCustomer(customerId),
  fetchActivities: (customerId?: string) => useCRMStore.getState().fetchActivities(customerId),
  getCustomerActivities: (customerId: string) =>
    useCRMStore.getState().getCustomerActivities(customerId),
  getActivityLog: () => useCRMStore.getState().getActivityLog(),
  createActivity: (input: Omit<Activity, 'id' | 'date' | 'timestamp'> & { occurredAt?: string }) =>
    useCRMStore.getState().createActivity(input),
  fetchDashboardSummary: (options?: { lookbackDays?: number }) =>
    useCRMStore.getState().fetchDashboardSummary(options),
  clearError: () => useCRMStore.getState().clearError(),
})

export default crmStore
