export type AdminStatus = 'pending' | 'active' | 'disabled'

export interface SystemSetting {
  key: string
  value: string
  label: string
  category: 'security' | 'integration' | 'notifications' | 'general' | string
  description?: string
  updatedAt: string
  isSensitive?: boolean
}

export interface AdminUserSummary {
  id: string
  name: string
  email: string
  role: string
  status: AdminStatus
  lastActiveAt: string | null
}

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  scope: string
  createdAt: string
  severity: 'info' | 'warning' | 'critical'
  metadata?: Record<string, unknown>
}

export interface FeatureFlag {
  key: string
  label: string
  description?: string
  enabled: boolean
  rolloutPercentage?: number
}

export interface AdminDashboardSnapshot {
  environment: 'production' | 'staging' | 'test' | string
  health: 'green' | 'yellow' | 'red'
  incidentsOpen: number
  tasksPending: number
  lastDeployedAt: string | null
}
