import { z } from 'zod'
import { EnvSchema, type RawEnv } from './schema'

export const AppModeSchema = z.enum(['app', 'scanner'])
export type AppMode = z.infer<typeof AppModeSchema>

export interface NormalizedEnv {
  readonly appMode: AppMode
  readonly apiBaseUrl: string
}

const UrlSchema = z.string().url()
const DEFAULT_API_BASE_URL = 'http://localhost:8000'

function coerceUrl(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = UrlSchema.safeParse(trimmed)
  if (!parsed.success) {
    throw new Error(`Invalid URL provided in environment: ${trimmed}`)
  }
  return parsed.data
}

function resolveSources(): RawEnv {
  const importMetaEnv =
    typeof import.meta !== 'undefined' && import.meta?.env ? (import.meta.env as Record<string, unknown>) : {}
  const processEnv =
    typeof process !== 'undefined' && process?.env ? (process.env as Record<string, unknown>) : {}
  const merged = { ...processEnv, ...importMetaEnv }
  const result = EnvSchema.safeParse(merged)
  if (!result.success) {
    const message = JSON.stringify(result.error.format())
    throw new Error(`Invalid environment configuration: ${message}`)
  }
  return result.data
}

export function resolveEnv(overrides: Partial<RawEnv> = {}): NormalizedEnv {
  const raw = { ...resolveSources(), ...overrides }
  const modeCandidate = raw.VITE_APP_MODE?.toString().trim().toLowerCase()
  const appMode = AppModeSchema.parse(modeCandidate && modeCandidate.length ? modeCandidate : 'app')

  const candidateUrl =
    coerceUrl(raw.VITE_API_BASE?.toString()) ?? coerceUrl(raw.VITE_API_URL?.toString()) ?? DEFAULT_API_BASE_URL
  const apiBaseUrl = UrlSchema.parse(candidateUrl)

  return Object.freeze({
    appMode,
    apiBaseUrl,
  })
}

export const env = resolveEnv()
