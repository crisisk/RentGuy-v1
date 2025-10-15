function normaliseAppMode(value) {
  const candidate = (value ?? '').toString().toLowerCase()
  return candidate === 'scanner' ? 'scanner' : 'planner'
}

function ensureUrl(value, fallback) {
  const candidate = value ?? fallback
  try {
    const parsed = new URL(candidate)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`)
    }
    return parsed.toString().replace(/\/$/, '')
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn(`Invalid URL provided for client environment: ${reason}. Falling back to ${fallback}.`)
    return fallback
  }
}

export function createClientEnv(mode) {
  const resolvedMode = mode === 'production' ? 'production' : mode === 'test' ? 'test' : 'development'
  const defaultApi = 'http://localhost:8000'
  const apiUrl = ensureUrl(process.env.VITE_API_URL, ensureUrl(process.env.VITE_API_BASE, defaultApi))
  const apiBase = ensureUrl(process.env.VITE_API_BASE, apiUrl)

  return {
    MODE: resolvedMode,
    DEV: resolvedMode !== 'production',
    PROD: resolvedMode === 'production',
    TEST: resolvedMode === 'test',
    BASE_URL: '/',
    SSR: false,
    VITE_APP_MODE: normaliseAppMode(process.env.VITE_APP_MODE),
    VITE_API_URL: apiUrl,
    VITE_API_BASE: apiBase,
  }
}

export function createEsbuildDefine(mode) {
  const env = createClientEnv(mode)
  const nodeEnv = mode === 'production' ? 'production' : mode === 'test' ? 'test' : 'development'
  return {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    'import.meta.env': JSON.stringify(env),
  }
}
