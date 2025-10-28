export type EmailDiagnosticsStatus = 'ok' | 'warning' | 'error'

export interface ManagedSecret {
  readonly key: string
  readonly label: string
  readonly category: string
  readonly description?: string | null
  readonly isSensitive: boolean
  readonly requiresRestart: boolean
  readonly hasValue: boolean
  readonly valueHint?: string | null
  readonly updatedAt?: string | null
  readonly lastSyncedAt?: string | null
}

export interface SecretUpdatePayload {
  readonly value?: string | null
}

export interface SecretsSyncSummary {
  readonly applied: number
  readonly envPath: string
  readonly triggeredRestart: boolean
  readonly timestamp: string
}

export interface EmailDiagnostics {
  readonly status: EmailDiagnosticsStatus
  readonly message: string
  readonly missing: readonly string[]
  readonly configured: readonly string[]
  readonly nodeReady: boolean
  readonly authConfigured: boolean
}
