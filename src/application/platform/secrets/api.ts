import { api } from '@infra/http/api'
import { err, ok, type Result } from '@core/result'
import { mapUnknownToApiError } from '@errors'
import type {
  EmailDiagnostics,
  ManagedSecret,
  SecretUpdatePayload,
  SecretsSyncSummary,
} from '@rg-types/platform'

interface SecretResponseRaw {
  key: string
  label: string
  category: string
  description?: string | null
  is_sensitive: boolean
  requires_restart: boolean
  has_value: boolean
  value_hint?: string | null
  updated_at?: string | null
  last_synced_at?: string | null
}

interface SecretSyncResponseRaw {
  applied: number
  env_path: string
  triggered_restart: boolean
  timestamp: string
}

interface EmailDiagnosticsRaw {
  status: 'ok' | 'warning' | 'error'
  message: string
  missing: string[]
  configured: string[]
  node_ready: boolean
  auth_configured: boolean
}

function mapSecretResponse(raw: SecretResponseRaw): ManagedSecret {
  return {
    key: raw.key,
    label: raw.label,
    category: raw.category,
    description: raw.description ?? null,
    isSensitive: raw.is_sensitive,
    requiresRestart: raw.requires_restart,
    hasValue: raw.has_value,
    valueHint: raw.value_hint ?? null,
    updatedAt: raw.updated_at ?? null,
    lastSyncedAt: raw.last_synced_at ?? null,
  }
}

function mapSyncResponse(raw: SecretSyncResponseRaw): SecretsSyncSummary {
  return {
    applied: raw.applied,
    envPath: raw.env_path,
    triggeredRestart: raw.triggered_restart,
    timestamp: raw.timestamp,
  }
}

function mapEmailDiagnostics(raw: EmailDiagnosticsRaw): EmailDiagnostics {
  return {
    status: raw.status,
    message: raw.message,
    missing: raw.missing,
    configured: raw.configured,
    nodeReady: raw.node_ready,
    authConfigured: raw.auth_configured,
  }
}

export async function fetchManagedSecrets(): Promise<Result<ManagedSecret[]>> {
  try {
    const { data } = await api.get<SecretResponseRaw[]>('/api/v1/platform/secrets')
    return ok(data.map(mapSecretResponse))
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}

export async function updateManagedSecret(
  key: string,
  payload: SecretUpdatePayload,
): Promise<Result<ManagedSecret>> {
  try {
    const { data } = await api.put<SecretResponseRaw>(
      `/api/v1/platform/secrets/${encodeURIComponent(key)}`,
      payload,
    )
    return ok(mapSecretResponse(data))
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}

export async function syncManagedSecrets(): Promise<Result<SecretsSyncSummary>> {
  try {
    const { data } = await api.post<SecretSyncResponseRaw>('/api/v1/platform/secrets/sync')
    return ok(mapSyncResponse(data))
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}

export async function fetchEmailDiagnostics(): Promise<Result<EmailDiagnostics>> {
  try {
    const { data } = await api.get<EmailDiagnosticsRaw>(
      '/api/v1/platform/secrets/email/diagnostics',
    )
    return ok(mapEmailDiagnostics(data))
  } catch (error) {
    return err(mapUnknownToApiError(error))
  }
}
