export type SupplierEngagementStatus =
  | 'active'
  | 'inactive'
  | 'trial'
  | 'blocked'
  | 'offboarded'
  | 'prospect'

export type SupplierDashboardMetricKey =
  | 'onTimeDeliveryRate'
  | 'openOrders'
  | 'incidentCount'
  | 'averageResponseTime'
  | 'utilizationRate'
  | 'slaBreaches'

export type SupplierDashboardTrend = 'up' | 'down' | 'flat'

export interface SupplierDashboardProvenance {
  readonly snapshotId: string
  readonly generatedAt: string
  readonly generatedBy: string
  readonly sourceSystems: readonly string[]
  readonly syncMethod: 'manual' | 'scheduled' | 'api'
  readonly dataWindow: {
    readonly start: string
    readonly end: string
  }
  readonly dataVersion?: string
  readonly notes?: string
}

export interface SupplierDashboardMetric {
  readonly key: SupplierDashboardMetricKey
  readonly label: string
  readonly value: number
  readonly unit?: string
  readonly change?: number
  readonly trend?: SupplierDashboardTrend
}

export interface SupplierDashboardAlert {
  readonly id: string
  readonly severity: 'info' | 'warning' | 'critical'
  readonly message: string
  readonly createdAt: string
  readonly acknowledgedAt?: string | null
}

export interface SupplierDashboardSnapshot {
  readonly supplierId: string
  readonly supplierName: string
  readonly engagementStatus: SupplierEngagementStatus
  readonly segment?: string
  readonly periodStart: string
  readonly periodEnd: string
  readonly metrics: readonly SupplierDashboardMetric[]
  readonly alerts: readonly SupplierDashboardAlert[]
  readonly provenance: SupplierDashboardProvenance
}

export interface SupplierDashboardCollection {
  readonly generatedAt: string
  readonly timeframe: {
    readonly start: string
    readonly end: string
  }
  readonly suppliers: readonly SupplierDashboardSnapshot[]
  readonly provenance: SupplierDashboardProvenance
}

export interface SupplierDashboardFilter {
  readonly segments?: readonly string[]
  readonly statuses?: readonly SupplierEngagementStatus[]
  readonly minimumReliabilityScore?: number
  readonly includeInactive?: boolean
}
