import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from './storage'

const hasWindow = typeof window !== 'undefined'
const hasSessionStorage = hasWindow && typeof window.sessionStorage !== 'undefined'

const TOKEN_STORAGE_KEY = 'rg__auth_session_v1'
const LEGACY_TOKEN_STORAGE_KEY = 'token'
export const DEFAULT_TOKEN_TTL_MS = 1000 * 60 * 60 // 1 hour

export interface TokenPersistenceOptions {
  readonly ttlMs?: number
}

type TokenRecord = {
  readonly value: string
  readonly expiresAt: number
}

let inMemoryRecord: TokenRecord | null = null
let expiryTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<(token: string) => void>()
let lastBroadcastToken = ''

function resolveTtl(options: TokenPersistenceOptions | undefined): number {
  const candidate = options?.ttlMs
  if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
    return candidate
  }
  return DEFAULT_TOKEN_TTL_MS
}

function safeSessionCall<T>(fn: () => T, fallback: T): T {
  if (!hasSessionStorage) {
    return fallback
  }
  try {
    return fn()
  } catch (error) {
    console.warn('SessionStorage access blocked', error)
    return fallback
  }
}

function parseRecord(rawValue: string | null): TokenRecord | null {
  if (!rawValue) {
    return null
  }
  try {
    const parsed = JSON.parse(rawValue) as Partial<TokenRecord>
    if (!parsed || typeof parsed.value !== 'string' || typeof parsed.expiresAt !== 'number') {
      return null
    }
    return { value: parsed.value, expiresAt: parsed.expiresAt }
  } catch (error) {
    console.warn('Kon sessietoken niet parsen', error)
    return null
  }
}

function isExpired(record: TokenRecord): boolean {
  return record.expiresAt <= Date.now()
}

function cancelExpiryTimer(): void {
  if (expiryTimer) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
}

function notifyListeners(token: string): void {
  if (token === lastBroadcastToken) {
    return
  }
  lastBroadcastToken = token
  listeners.forEach(listener => {
    try {
      listener(token)
    } catch (error) {
      console.error('Kon tokenlistener niet aanroepen', error)
    }
  })
}

function readLegacyToken(): string {
  const stored = getLocalStorageItem(LEGACY_TOKEN_STORAGE_KEY, '')
  return typeof stored === 'string' ? stored : ''
}

function persistLegacyToken(token: string): void {
  if (!token) {
    removeLocalStorageItem(LEGACY_TOKEN_STORAGE_KEY)
    return
  }
  setLocalStorageItem(LEGACY_TOKEN_STORAGE_KEY, token)
}

function clearLegacyToken(): void {
  removeLocalStorageItem(LEGACY_TOKEN_STORAGE_KEY)
}

function scheduleExpiry(record: TokenRecord): void {
  if (!hasWindow) {
    return
  }
  cancelExpiryTimer()
  const delay = Math.max(0, record.expiresAt - Date.now())
  expiryTimer = window.setTimeout(() => {
    clearStoredToken()
  }, delay) as unknown as number
}

function persistRecord(record: TokenRecord): void {
  inMemoryRecord = record
  safeSessionCall(
    () => {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(record))
      return undefined
    },
    undefined,
  )
  scheduleExpiry(record)
  persistLegacyToken(record.value)
}

function readPersistedRecord(): TokenRecord | null {
  if (inMemoryRecord) {
    return inMemoryRecord
  }
  const raw = safeSessionCall(() => window.sessionStorage.getItem(TOKEN_STORAGE_KEY), null)
  const parsed = parseRecord(raw)
  if (!parsed) {
    if (raw) {
      safeSessionCall(
        () => {
          window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
          return undefined
        },
        undefined,
      )
    }
    return null
  }
  inMemoryRecord = parsed
  return parsed
}

function getActiveRecord(): TokenRecord | null {
  const record = readPersistedRecord()
  if (!record) {
    return null
  }
  if (isExpired(record)) {
    clearStoredToken()
    return null
  }
  scheduleExpiry(record)
  return record
}

export function getStoredToken(): string {
  const record = getActiveRecord()
  if (record?.value) {
    return record.value
  }
  const legacyToken = readLegacyToken().trim()
  return legacyToken
}

export function persistToken(token: string, options?: TokenPersistenceOptions): void {
  const trimmed = token.trim()
  if (!trimmed) {
    clearStoredToken()
    return
  }
  const ttl = resolveTtl(options)
  const record: TokenRecord = {
    value: trimmed,
    expiresAt: Date.now() + ttl,
  }
  persistRecord(record)
  notifyListeners(record.value)
}

export function clearStoredToken(): void {
  cancelExpiryTimer()
  const hadValue = inMemoryRecord?.value ?? ''
  inMemoryRecord = null
  safeSessionCall(
    () => {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      return undefined
    },
    undefined,
  )
  clearLegacyToken()
  if (hadValue || lastBroadcastToken) {
    notifyListeners('')
  }
}

export function subscribeToTokenChanges(listener: (token: string) => void): () => void {
  listeners.add(listener)
  listener(getStoredToken())
  return () => {
    listeners.delete(listener)
  }
}

if (hasWindow) {
  window.addEventListener('storage', event => {
    if (event.key !== TOKEN_STORAGE_KEY) {
      return
    }
    const parsed = parseRecord(event.newValue)
    if (!parsed || isExpired(parsed)) {
      cancelExpiryTimer()
      inMemoryRecord = null
      notifyListeners('')
      return
    }
    persistRecord(parsed)
    notifyListeners(parsed.value)
  })
}
