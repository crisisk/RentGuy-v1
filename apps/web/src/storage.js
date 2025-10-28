const DEFAULT_LOCALE = 'nl-NL'
const DEFAULT_CURRENCY = 'EUR'
const LOCALE_STORAGE_KEY = 'user_locale'

const hasWindow = typeof window !== 'undefined'
const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined'

function resolveFallback(fallback) {
  return typeof fallback === 'function' ? fallback() : fallback
}

function safeCall(fn, fallback) {
  if (!hasLocalStorage) return resolveFallback(fallback)
  try {
    return fn()
  } catch (error) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('LocalStorage access blocked', error)
    }
    return resolveFallback(fallback)
  }
}

export function getLocalStorageItem(key, fallback = '') {
  return safeCall(() => window.localStorage.getItem(key) ?? resolveFallback(fallback), fallback)
}

export function setLocalStorageItem(key, value) {
  safeCall(() => {
    if (value === undefined || value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, typeof value === 'string' ? value : String(value))
    }
  })
}

export function removeLocalStorageItem(key) {
  safeCall(() => window.localStorage.removeItem(key))
}

export function storageAvailable() {
  return hasLocalStorage
}

function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (value === null || value === undefined) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function withOptions(defaultOptions, override) {
  if (!override) return defaultOptions
  const filtered = Object.entries(override).reduce((acc, [key, val]) => {
    if (val !== undefined) acc[key] = val
    return acc
  }, {})
  return { ...defaultOptions, ...filtered }
}

export function getPreferredLocale(fallback = DEFAULT_LOCALE) {
  const stored = getLocalStorageItem(LOCALE_STORAGE_KEY, fallback)
  return stored || fallback
}

export function setPreferredLocale(locale) {
  if (!locale) {
    removeLocalStorageItem(LOCALE_STORAGE_KEY)
    return
  }
  setLocalStorageItem(LOCALE_STORAGE_KEY, locale)
}

const DEFAULT_DATE_OPTIONS = Object.freeze({
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const DEFAULT_TIME_OPTIONS = Object.freeze({
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const DEFAULT_DATE_TIME_OPTIONS = Object.freeze({
  ...DEFAULT_DATE_OPTIONS,
  ...DEFAULT_TIME_OPTIONS,
})

function formatWithOptions(value, baseOptions) {
  const date = toDate(value)
  if (!date) return '—'
  const locale = getPreferredLocale()
  return new Intl.DateTimeFormat(locale, baseOptions).format(date)
}

export function formatDate(value, options) {
  return formatWithOptions(value, withOptions(DEFAULT_DATE_OPTIONS, options))
}

export function formatTime(value, options) {
  return formatWithOptions(value, withOptions(DEFAULT_TIME_OPTIONS, options))
}

export function formatDateTime(value, options) {
  return formatWithOptions(value, withOptions(DEFAULT_DATE_TIME_OPTIONS, options))
}

export function formatCurrency(value, { currency = DEFAULT_CURRENCY, ...options } = {}) {
  if (value === null || value === undefined) return '—'
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value
  if (!Number.isFinite(amount)) return '—'
  const locale = getPreferredLocale()
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
  return formatter.format(amount)
}

export { DEFAULT_LOCALE, DEFAULT_CURRENCY }
