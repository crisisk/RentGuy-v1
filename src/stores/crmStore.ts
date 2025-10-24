import create from 'zustand'
import { api } from '@infra/http/api'
import { APIError, mapUnknownToApiError } from '@errors'

type CRMCustomerStatus = 'active' | 'pending' | 'inactive' | 'archived'

type CRMActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task'

export interface CRMCustomer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly status: CRMCustomerStatus
  readonly company: string
  readonly address: string
  readonly createdAt: string
}

export interface CRMCustomerInput {
  readonly id?: string
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly status?: CRMCustomerStatus
  readonly company?: string
  readonly address?: string
}

export interface CRMActivity {
  readonly id: string
  readonly customerId?: string
  readonly type: CRMActivityType
  readonly date: string
  readonly description: string
  readonly user?: string
}

export interface CRMActivityLogEntry {
  readonly id: string
  readonly type: CRMActivityType
  readonly timestamp: string
  readonly description: string
  readonly user: string
  readonly customerId?: string
}

export interface CRMRecentActivity {
  readonly id: string
  readonly type: 'sale' | 'support' | 'signup'
  readonly customerName: string
  readonly timestamp: number
}

export interface CRMPipelineStageKPI {
  readonly stageId: number
  readonly stageName: string
  readonly dealCount: number
  readonly totalValue: number
  readonly weightedValue: number
  readonly avgAgeDays: number | null
}

export interface CRMSalesKPIs {
  readonly openDeals: number
  readonly wonDealsLast30Days: number
  readonly lostDealsLast30Days: number
  readonly totalDeals: number
  readonly bookingsLast30Days: number
  readonly winRate: number
  readonly avgDealValue: number | null
  readonly forecastNext30Days: number
  readonly pipelineVelocityPerDay: number
}

interface CRMHeadlineKPIs {
  readonly totalPipelineValue: number
  readonly weightedPipelineValue: number
  readonly wonValueLast30Days: number
  readonly avgDealCycleDays: number | null
  readonly automationFailureRate: number
  readonly activeWorkflows: number
}

interface CRMLeadFunnelKPIs {
  readonly totalLeads: number
  readonly leadsLast30Days: number
  readonly leadsWithDeals: number
  readonly conversionRate: number
}

interface CRMSourcePerformanceKPI {
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

interface CRMAcquisitionKPIs {
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

export interface CRMDashboardSummary {
  readonly generatedAt: string
  readonly headline: CRMHeadlineKPIs
  readonly leadFunnel: CRMLeadFunnelKPIs
  readonly pipeline: CRMPipelineStageKPI[]
  readonly sales: CRMSalesKPIs
  readonly acquisition: CRMAcquisitionKPIs
  readonly sourcePerformance: CRMSourcePerformanceKPI[]
  readonly provenance: {
    readonly source: string
    readonly upstreamSystems: string[]
    readonly lastRefreshedAt: string | null
  }
}

export interface CRMCustomerStats {
  readonly total: number
  readonly newThisMonth: number
  readonly activeCustomers: number
}

interface CRMStoreState {
  customers: CRMCustomer[]
  customerActivities: Record<string, { entries: CRMActivity[]; fetchedAt: number }>
  activityLog: CRMActivityLogEntry[]
  dashboardSummary: CRMDashboardSummary | null
  loading: boolean
  error: string | null
  lastCustomersFetch: number | null
  lastActivityLogFetch: number | null
  lastDashboardFetch: number | null
  fetchCustomers: (force?: boolean) => Promise<CRMCustomer[]>
  fetchCustomerById: (customerId: string) => Promise<CRMCustomer | null>
  upsertCustomer: (customer: CRMCustomerInput) => Promise<CRMCustomer>
  fetchCustomerActivities: (customerId: string, force?: boolean) => Promise<CRMActivity[]>
  fetchActivityLog: (force?: boolean) => Promise<CRMActivityLogEntry[]>
  fetchDashboardSummary: (force?: boolean) => Promise<CRMDashboardSummary>
  computeCustomerStats: () => Promise<CRMCustomerStats>
}

interface RemoteCustomer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone?: string | null
  readonly company?: string | null
  readonly address?: string | null
  readonly status?: string | null
  readonly created_at?: string | null
}

interface RemoteActivity {
  readonly id: string
  readonly customer_id?: string | null
  readonly activity_type?: string | null
  readonly type?: string | null
  readonly description?: string | null
  readonly summary?: string | null
  readonly occurred_at?: string | null
  readonly created_at?: string | null
  readonly user?: string | null
}

interface RemotePipelineStageKPI {
  readonly stage_id: number
  readonly stage_name: string
  readonly deal_count: number
  readonly total_value: number
  readonly weighted_value: number
  readonly avg_age_days?: number | null
}

interface RemoteSalesKPIs {
  readonly open_deals: number
  readonly won_deals_last_30_days: number
  readonly lost_deals_last_30_days: number
  readonly total_deals: number
  readonly bookings_last_30_days: number
  readonly win_rate: number
  readonly avg_deal_value?: number | null
  readonly forecast_next_30_days: number
  readonly pipeline_velocity_per_day: number
}

interface RemoteHeadlineKPIs {
  readonly total_pipeline_value: number
  readonly weighted_pipeline_value: number
  readonly won_value_last_30_days: number
  readonly avg_deal_cycle_days?: number | null
  readonly automation_failure_rate: number
  readonly active_workflows: number
}

interface RemoteLeadFunnelKPIs {
  readonly total_leads: number
  readonly leads_last_30_days: number
  readonly leads_with_deals: number
  readonly conversion_rate: number
}

interface RemoteAcquisitionKPIs {
  readonly lookback_days: number
  readonly ga_sessions: number
  readonly ga_new_users: number
  readonly ga_engaged_sessions: number
  readonly ga_conversions: number
  readonly ga_conversion_value: number
  readonly gtm_conversions: number
  readonly gtm_conversion_value: number
  readonly blended_conversion_rate: number
  readonly active_connectors: string[]
}

interface RemoteSourcePerformanceKPI {
  readonly key: string
  readonly label: string
  readonly dimension_type: string
  readonly lead_count: number
  readonly deal_count: number
  readonly won_deal_count: number
  readonly pipeline_value: number
  readonly won_value: number
  readonly ga_sessions: number
  readonly ga_conversions: number
  readonly gtm_conversions: number
  readonly ga_revenue: number
  readonly gtm_revenue: number
}

interface RemoteDashboardSummary {
  readonly generated_at: string
  readonly headline: RemoteHeadlineKPIs
  readonly lead_funnel: RemoteLeadFunnelKPIs
  readonly pipeline: RemotePipelineStageKPI[]
  readonly automation: unknown[]
  readonly sales: RemoteSalesKPIs
  readonly acquisition: RemoteAcquisitionKPIs
  readonly source_performance: RemoteSourcePerformanceKPI[]
  readonly provenance?: {
    readonly source?: string
    readonly upstream_systems?: string[]
    readonly last_refreshed_at?: string | null
  }
}

const CRM_BASE_PATH = '/api/v1/crm'
const CACHE_TTL_MS = 2 * 60 * 1000

function isoDateFromDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function isoDateFromMinutesAgo(minutes: number): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() - minutes)
  return date.toISOString()
}

const FALLBACK_CUSTOMERS: CRMCustomer[] = [
  {
    id: 'fallback-customer-1',
    name: 'Event Crew BV',
    email: 'sales@eventcrew.test',
    phone: '+31 20 123 4567',
    status: 'active',
    company: 'Event Crew BV',
    address: 'Kalverstraat 1, Amsterdam',
    createdAt: isoDateFromDaysAgo(18),
  },
  {
    id: 'fallback-customer-2',
    name: 'Festival Masters',
    email: 'info@festivalmasters.test',
    phone: '+31 10 765 4321',
    status: 'pending',
    company: 'Festival Masters',
    address: 'Coolsingel 14, Rotterdam',
    createdAt: isoDateFromDaysAgo(6),
  },
  {
    id: 'fallback-customer-3',
    name: 'Wedding Beats',
    email: 'hello@weddingbeats.test',
    phone: '+31 6 1234 5678',
    status: 'active',
    company: 'Wedding Beats',
    address: 'Stationsweg 8, Utrecht',
    createdAt: isoDateFromDaysAgo(2),
  },
]

const FALLBACK_ACTIVITY_LOG: CRMActivityLogEntry[] = [
  {
    id: 'fallback-activity-1',
    type: 'call',
    timestamp: isoDateFromMinutesAgo(45),
    description: 'Nabellen offerte voor corporate event (verwachte waarde €8.500).',
    user: 'Chantal · Sales',
    customerId: 'fallback-customer-1',
  },
  {
    id: 'fallback-activity-2',
    type: 'meeting',
    timestamp: isoDateFromMinutesAgo(120),
    description: 'Intake meeting met Festival Masters over mainstage productie.',
    user: 'Jasper · BD',
    customerId: 'fallback-customer-2',
  },
  {
    id: 'fallback-activity-3',
    type: 'email',
    timestamp: isoDateFromMinutesAgo(260),
    description: 'Voorstel gestuurd met upsell-kit voor Wedding Beats summer tour.',
    user: 'Chantal · Sales',
    customerId: 'fallback-customer-3',
  },
]

const FALLBACK_DASHBOARD_SUMMARY: CRMDashboardSummary = {
  generatedAt: new Date().toISOString(),
  headline: {
    totalPipelineValue: 125_000,
    weightedPipelineValue: 64_000,
    wonValueLast30Days: 32_000,
    avgDealCycleDays: 18.5,
    automationFailureRate: 0.01,
    activeWorkflows: 3,
  },
  leadFunnel: {
    totalLeads: 240,
    leadsLast30Days: 32,
    leadsWithDeals: 78,
    conversionRate: 0.325,
  },
  pipeline: [
    {
      stageId: 1,
      stageName: 'Intake',
      dealCount: 12,
      totalValue: 22_000,
      weightedValue: 9_500,
      avgAgeDays: 3.2,
    },
    {
      stageId: 2,
      stageName: 'Proposal',
      dealCount: 8,
      totalValue: 34_500,
      weightedValue: 18_200,
      avgAgeDays: 5.6,
    },
  ],
  sales: {
    openDeals: 32,
    wonDealsLast30Days: 6,
    lostDealsLast30Days: 3,
    totalDeals: 120,
    bookingsLast30Days: 4,
    winRate: 0.42,
    avgDealValue: 5_200,
    forecastNext30Days: 18_500,
    pipelineVelocityPerDay: 2_100,
  },
  acquisition: {
    lookbackDays: 30,
    gaSessions: 4_200,
    gaNewUsers: 1_800,
    gaEngagedSessions: 3_900,
    gaConversions: 96,
    gaConversionValue: 28_500,
    gtmConversions: 54,
    gtmConversionValue: 18_300,
    blendedConversionRate: 0.032,
    activeConnectors: ['ga4', 'gtm'],
  },
  sourcePerformance: [
    {
      key: 'google_ads',
      label: 'Google Ads',
      dimensionType: 'channel',
      leadCount: 54,
      dealCount: 24,
      wonDealCount: 12,
      pipelineValue: 42_000,
      wonValue: 21_000,
      gaSessions: 1_800,
      gaConversions: 36,
      gtmConversions: 18,
      gaRevenue: 12_000,
      gtmRevenue: 6_000,
    },
    {
      key: 'referral_partner',
      label: 'Referral Partners',
      dimensionType: 'lead_source',
      leadCount: 18,
      dealCount: 9,
      wonDealCount: 5,
      pipelineValue: 18_000,
      wonValue: 9_000,
      gaSessions: 0,
      gaConversions: 0,
      gtmConversions: 0,
      gaRevenue: 0,
      gtmRevenue: 0,
    },
  ],
  provenance: {
    source: 'mock',
    upstreamSystems: ['crm', 'ga4', 'gtm'],
    lastRefreshedAt: new Date().toISOString(),
  },
}

function toCustomerStatus(value?: string | null): CRMCustomerStatus {
  if (!value) {
    return 'active'
  }
  const lowered = value.trim().toLowerCase()
  if (lowered === 'pending') return 'pending'
  if (lowered === 'inactive') return 'inactive'
  if (lowered === 'archived') return 'archived'
  return 'active'
}

function normalizeCustomer(candidate: RemoteCustomer): CRMCustomer {
  const createdAt = candidate.created_at ?? isoDateFromDaysAgo(0)
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    phone: (candidate.phone ?? '').trim() || '+31 6 0000 0000',
    status: toCustomerStatus(candidate.status),
    company: candidate.company?.trim() || candidate.name,
    address: candidate.address?.trim() || 'Adres onbekend',
    createdAt,
  }
}

function normalizeActivity(candidate: RemoteActivity): CRMActivity {
  const occurredAt = candidate.occurred_at ?? candidate.created_at ?? isoDateFromMinutesAgo(0)
  const rawType = candidate.activity_type ?? candidate.type ?? 'note'
  const normalizedType = rawType.toLowerCase() as CRMActivityType
  return {
    id: candidate.id,
    customerId: candidate.customer_id ?? undefined,
    type: ['call', 'email', 'meeting', 'note', 'task'].includes(normalizedType)
      ? (normalizedType as CRMActivityType)
      : 'note',
    date: occurredAt,
    description: candidate.description ?? candidate.summary ?? 'Activiteit',
    user: candidate.user ?? undefined,
  }
}

function normalizeActivityLogEntry(candidate: RemoteActivity): CRMActivityLogEntry {
  const activity = normalizeActivity(candidate)
  return {
    id: activity.id,
    type: activity.type,
    timestamp: activity.date,
    description: activity.description,
    user: activity.user ?? 'Sales team',
    customerId: activity.customerId,
  }
}

function activityToRecentActivity(
  entry: CRMActivityLogEntry,
  customerMap: Record<string, CRMCustomer>,
): CRMRecentActivity {
  const customerName = entry.customerId ? customerMap[entry.customerId]?.name : undefined
  const category = entry.type === 'meeting' || entry.type === 'email' ? 'support' : 'sale'
  return {
    id: entry.id,
    type: category,
    customerName: customerName ?? 'Onbekende klant',
    timestamp: new Date(entry.timestamp).getTime(),
  }
}

function normalizeDashboardSummary(data: RemoteDashboardSummary): CRMDashboardSummary {
  return {
    generatedAt: data.generated_at,
    headline: {
      totalPipelineValue: data.headline.total_pipeline_value,
      weightedPipelineValue: data.headline.weighted_pipeline_value,
      wonValueLast30Days: data.headline.won_value_last_30_days,
      avgDealCycleDays: data.headline.avg_deal_cycle_days ?? null,
      automationFailureRate: data.headline.automation_failure_rate,
      activeWorkflows: data.headline.active_workflows,
    },
    leadFunnel: {
      totalLeads: data.lead_funnel.total_leads,
      leadsLast30Days: data.lead_funnel.leads_last_30_days,
      leadsWithDeals: data.lead_funnel.leads_with_deals,
      conversionRate: data.lead_funnel.conversion_rate,
    },
    pipeline: (data.pipeline ?? []).map<CRMPipelineStageKPI>((stage) => ({
      stageId: stage.stage_id,
      stageName: stage.stage_name,
      dealCount: stage.deal_count,
      totalValue: stage.total_value,
      weightedValue: stage.weighted_value,
      avgAgeDays: stage.avg_age_days ?? null,
    })),
    sales: {
      openDeals: data.sales.open_deals,
      wonDealsLast30Days: data.sales.won_deals_last_30_days,
      lostDealsLast30Days: data.sales.lost_deals_last_30_days,
      totalDeals: data.sales.total_deals,
      bookingsLast30Days: data.sales.bookings_last_30_days,
      winRate: data.sales.win_rate,
      avgDealValue: data.sales.avg_deal_value ?? null,
      forecastNext30Days: data.sales.forecast_next_30_days,
      pipelineVelocityPerDay: data.sales.pipeline_velocity_per_day,
    },
    acquisition: {
      lookbackDays: data.acquisition.lookback_days,
      gaSessions: data.acquisition.ga_sessions,
      gaNewUsers: data.acquisition.ga_new_users,
      gaEngagedSessions: data.acquisition.ga_engaged_sessions,
      gaConversions: data.acquisition.ga_conversions,
      gaConversionValue: data.acquisition.ga_conversion_value,
      gtmConversions: data.acquisition.gtm_conversions,
      gtmConversionValue: data.acquisition.gtm_conversion_value,
      blendedConversionRate: data.acquisition.blended_conversion_rate,
      activeConnectors: data.acquisition.active_connectors,
    },
    sourcePerformance: (data.source_performance ?? []).map<CRMSourcePerformanceKPI>((item) => ({
      key: item.key,
      label: item.label,
      dimensionType: item.dimension_type,
      leadCount: item.lead_count,
      dealCount: item.deal_count,
      wonDealCount: item.won_deal_count,
      pipelineValue: item.pipeline_value,
      wonValue: item.won_value,
      gaSessions: item.ga_sessions,
      gaConversions: item.ga_conversions,
      gtmConversions: item.gtm_conversions,
      gaRevenue: item.ga_revenue,
      gtmRevenue: item.gtm_revenue,
    })),
    provenance: {
      source: data.provenance?.source ?? 'unknown',
      upstreamSystems: data.provenance?.upstream_systems ?? [],
      lastRefreshedAt: data.provenance?.last_refreshed_at ?? null,
    },
  }
}

function resolveErrorMessage(error: unknown): APIError {
  return mapUnknownToApiError(error)
}

const baseStore = create<CRMStoreState>((set, get) => ({
  customers: [],
  customerActivities: {},
  activityLog: [],
  dashboardSummary: null,
  loading: false,
  error: null,
  lastCustomersFetch: null,
  lastActivityLogFetch: null,
  lastDashboardFetch: null,
  async fetchCustomers(force = false) {
    const { lastCustomersFetch, customers } = get()
    const shouldUseCache =
      !force &&
      lastCustomersFetch &&
      Date.now() - lastCustomersFetch < CACHE_TTL_MS &&
      customers.length > 0
    if (shouldUseCache) {
      return customers
    }

    set((state) => {
      state.loading = true
      state.error = null
    })

    try {
      const response = await api.get<RemoteCustomer[]>(`${CRM_BASE_PATH}/customers`)
      const normalized = (Array.isArray(response.data) ? response.data : []).map(normalizeCustomer)
      set((state) => {
        state.customers = normalized
        state.lastCustomersFetch = Date.now()
        state.loading = false
      })
      return normalized
    } catch (error) {
      const appError = resolveErrorMessage(error)
      set((state) => {
        state.loading = false
        state.error = appError.message
        if (state.customers.length === 0) {
          state.customers = FALLBACK_CUSTOMERS
        }
        state.lastCustomersFetch = Date.now()
      })
      return get().customers
    }
  },
  async fetchCustomerById(customerId: string) {
    const existing = get().customers.find((customer) => customer.id === customerId)
    if (existing) {
      return existing
    }

    try {
      const response = await api.get<RemoteCustomer>(`${CRM_BASE_PATH}/customers/${customerId}`)
      const normalized = normalizeCustomer(response.data)
      set((state) => {
        state.customers = [
          ...state.customers.filter((customer) => customer.id !== normalized.id),
          normalized,
        ]
      })
      return normalized
    } catch (error) {
      const appError = resolveErrorMessage(error)
      set((state) => {
        state.error = appError.message
      })
      return null
    }
  },
  async upsertCustomer(customer: CRMCustomerInput) {
    try {
      if (customer.id) {
        const response = await api.put<RemoteCustomer>(
          `${CRM_BASE_PATH}/customers/${customer.id}`,
          customer,
        )
        const normalized = normalizeCustomer(response.data)
        set((state) => {
          state.customers = state.customers.map((existing) =>
            existing.id === normalized.id ? normalized : existing,
          )
        })
        return normalized
      }

      const response = await api.post<RemoteCustomer>(`${CRM_BASE_PATH}/customers`, customer)
      const normalized = normalizeCustomer(response.data)
      set((state) => {
        state.customers = [normalized, ...state.customers]
      })
      return normalized
    } catch (error) {
      const appError = resolveErrorMessage(error)
      set((state) => {
        state.error = appError.message
      })
      throw appError
    }
  },
  async fetchCustomerActivities(customerId: string, force = false) {
    const cached = get().customerActivities[customerId]
    const shouldUseCache = !force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS
    if (shouldUseCache) {
      return cached.entries
    }

    try {
      const response = await api.get<RemoteActivity[]>(`${CRM_BASE_PATH}/activities`, {
        params: { customerId },
      })
      const entries = (Array.isArray(response.data) ? response.data : []).map(normalizeActivity)
      set((state) => {
        state.customerActivities[customerId] = { entries, fetchedAt: Date.now() }
      })
      return entries
    } catch (error) {
      const appError = resolveErrorMessage(error)
      set((state) => {
        state.error = appError.message
        state.customerActivities[customerId] = {
          entries: FALLBACK_ACTIVITY_LOG.filter((entry) => entry.customerId === customerId).map(
            (entry) => ({
              id: entry.id,
              customerId: entry.customerId,
              type: entry.type,
              date: entry.timestamp,
              description: entry.description,
              user: entry.user,
            }),
          ),
          fetchedAt: Date.now(),
        }
      })
      return get().customerActivities[customerId]?.entries ?? []
    }
  },
  async fetchActivityLog(force = false) {
    const { lastActivityLogFetch, activityLog } = get()
    const shouldUseCache =
      !force &&
      lastActivityLogFetch &&
      Date.now() - lastActivityLogFetch < CACHE_TTL_MS &&
      activityLog.length > 0
    if (shouldUseCache) {
      return activityLog
    }

    try {
      const response = await api.get<RemoteActivity[]>(`${CRM_BASE_PATH}/activities`)
      const entries = (Array.isArray(response.data) ? response.data : []).map(
        normalizeActivityLogEntry,
      )
      set((state) => {
        state.activityLog = entries
        state.lastActivityLogFetch = Date.now()
      })
      return entries
    } catch (error) {
      const appError = resolveErrorMessage(error)
      set((state) => {
        state.error = appError.message
        if (state.activityLog.length === 0) {
          state.activityLog = FALLBACK_ACTIVITY_LOG
        }
        state.lastActivityLogFetch = Date.now()
      })
      return get().activityLog
    }
  },
  async fetchDashboardSummary(force = false) {
    const { lastDashboardFetch, dashboardSummary } = get()
    const shouldUseCache =
      !force &&
      lastDashboardFetch &&
      Date.now() - lastDashboardFetch < CACHE_TTL_MS &&
      dashboardSummary
    if (shouldUseCache && dashboardSummary) {
      return dashboardSummary
    }

    set((state) => {
      state.loading = true
      state.error = null
    })

    try {
      const response = await api.get<RemoteDashboardSummary>(`${CRM_BASE_PATH}/analytics/dashboard`)
      const summary = normalizeDashboardSummary(response.data)
      set((state) => {
        state.dashboardSummary = summary
        state.lastDashboardFetch = Date.now()
        state.loading = false
      })
      return summary
    } catch (error) {
      const appError = resolveErrorMessage(error)
      set((state) => {
        state.loading = false
        state.error = appError.message
        if (!state.dashboardSummary) {
          state.dashboardSummary = FALLBACK_DASHBOARD_SUMMARY
        }
        state.lastDashboardFetch = Date.now()
      })
      return get().dashboardSummary ?? FALLBACK_DASHBOARD_SUMMARY
    }
  },
  async computeCustomerStats() {
    const customers = await get().fetchCustomers()
    if (customers.length > 0) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const newThisMonth = customers.filter(
        (customer) => new Date(customer.createdAt) >= monthStart,
      ).length
      const activeCustomers = customers.filter(
        (customer) => customer.status === 'active' || customer.status === 'pending',
      ).length
      return {
        total: customers.length,
        newThisMonth,
        activeCustomers,
      }
    }

    const summary = await get().fetchDashboardSummary()
    return {
      total: summary.sales.totalDeals,
      newThisMonth: summary.sales.wonDealsLast30Days,
      activeCustomers: summary.sales.openDeals,
    }
  },
}))

const crmStore = {
  ...baseStore,
  async loadCustomers(force = false): Promise<CRMCustomer[]> {
    return baseStore.getState().fetchCustomers(force)
  },
  async getCustomerById(customerId: string): Promise<CRMCustomer | null> {
    return baseStore.getState().fetchCustomerById(customerId)
  },
  async getCustomer(customerId: string): Promise<CRMCustomer | null> {
    return baseStore.getState().fetchCustomerById(customerId)
  },
  async saveCustomer(customer: CRMCustomerInput): Promise<CRMCustomer> {
    return baseStore.getState().upsertCustomer(customer)
  },
  async getCustomerActivities(customerId: string, force = false): Promise<CRMActivity[]> {
    return baseStore.getState().fetchCustomerActivities(customerId, force)
  },
  async getActivityLog(force = false): Promise<CRMActivityLogEntry[]> {
    return baseStore.getState().fetchActivityLog(force)
  },
  async getRecentActivities(force = false): Promise<CRMRecentActivity[]> {
    const [activities, customers] = await Promise.all([
      baseStore.getState().fetchActivityLog(force),
      baseStore.getState().fetchCustomers(force),
    ])
    const customerMap = customers.reduce<Record<string, CRMCustomer>>((acc, customer) => {
      acc[customer.id] = customer
      return acc
    }, {})
    return activities.map((entry) => activityToRecentActivity(entry, customerMap))
  },
  async getCustomerStats(): Promise<CRMCustomerStats> {
    return baseStore.getState().computeCustomerStats()
  },
  async getDashboardSummary(force = false): Promise<CRMDashboardSummary> {
    return baseStore.getState().fetchDashboardSummary(force)
  },
}

export default crmStore
