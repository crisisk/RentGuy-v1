export interface ManagedSecret {
  key: string
  label: string
  category: string
  description?: string | null
  isSensitive: boolean
  requiresRestart: boolean
  hasValue: boolean
  valueHint?: string | null
  updatedAt?: string | null
  lastSyncedAt?: string | null
}

export interface SecretsSyncSummary {
  applied: number
  envPath: string
  triggeredRestart: boolean
  timestamp: string
}

export interface EmailDiagnostics {
  status: 'ok' | 'warning' | 'error'
  message: string
  missing: string[]
  configured: string[]
  nodeReady: boolean
  authConfigured: boolean
}
