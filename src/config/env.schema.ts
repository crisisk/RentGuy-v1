const ALLOWED_MODES = ['planner', 'scanner'] as const

export type ClientAppMode = (typeof ALLOWED_MODES)[number]

export type RawClientEnv = {
  VITE_APP_MODE?: string
  VITE_API_URL?: string
  [key: string]: unknown
}

function normaliseMode(value: string | undefined): ClientAppMode {
  const candidate = value?.toLowerCase()
  return (ALLOWED_MODES as readonly string[]).includes(candidate ?? '')
    ? (candidate as ClientAppMode)
    : 'planner'
}

function ensureUrl(value: string | undefined, fallback: string): string {
  const candidate = value ?? fallback
  try {
    // Throws if the URL is invalid; also guards against javascript: style protocols.
    const parsed = new URL(candidate)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol for API URL: ${parsed.protocol}`)
    }
    return parsed.toString().replace(/\/$/, '')
  } catch (error) {
    throw new Error(`Invalid VITE_API_URL provided: ${(error as Error).message}`)
  }
}

/**
 * Parse and validate the environment variables for safe runtime usage.
 */
export function loadClientEnv(envSource: unknown = import.meta.env) {
  const rawEnv = (envSource ?? {}) as RawClientEnv
  const mode = normaliseMode(rawEnv.VITE_APP_MODE)
  const apiUrl = ensureUrl(rawEnv.VITE_API_URL, 'http://localhost:8000')

  return {
    mode,
    apiUrl,
    isScannerMode: mode === 'scanner',
  }
}

export type ClientEnv = ReturnType<typeof loadClientEnv>
