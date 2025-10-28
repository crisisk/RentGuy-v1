export const DEFAULT_LOCALE = 'nl-NL'
export const DEFAULT_CURRENCY = 'EUR'
const LOCALE_STORAGE_KEY = 'user_locale'

const hasWindow = typeof window !== 'undefined'
const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined'

type StorageFallback<T> = T | (() => T)

function resolveFallback<T>(fallback: StorageFallback<T>): T {
  return typeof fallback === 'function' ? (fallback as () => T)() : fallback
}

function safeCall<T>(fn: () => T, fallback: StorageFallback<T>): T {
  if (!hasLocalStorage) {
    return resolveFallback(fallback)
  }
  try {
    return fn()
  } catch (error) {
    console.warn('LocalStorage access blocked', error)
    return resolveFallback(fallback)
  }
}

export function getLocalStorageItem(key: string, fallback: StorageFallback<string> = ''): string {
  return safeCall(() => window.localStorage.getItem(key) ?? resolveFallback(fallback), fallback)
}

export function setLocalStorageItem(key: string, value: string | null | undefined): void {
  safeCall(
    () => {
      if (value == null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, value)
      }
      return undefined
    },
    () => undefined,
  )
}

export function removeLocalStorageItem(key: string): void {
  safeCall(
    () => {
      window.localStorage.removeItem(key)
      return undefined
    },
    () => undefined,
  )
}

export function clearOnboardingState(): void {
  removeLocalStorageItem('onb_seen')
  removeLocalStorageItem('onb_snooze_until')
}

export const storageAvailable = hasLocalStorage

const DEFAULT_DATE_OPTIONS: Readonly<Intl.DateTimeFormatOptions> = Object.freeze({
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const DEFAULT_TIME_OPTIONS: Readonly<Intl.DateTimeFormatOptions> = Object.freeze({
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const DEFAULT_DATE_TIME_OPTIONS: Readonly<Intl.DateTimeFormatOptions> = Object.freeze({
  ...DEFAULT_DATE_OPTIONS,
  ...DEFAULT_TIME_OPTIONS,
})

function coerceDate(value: Date | string | number | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (value === null || value === undefined) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function mergeOptions(
  defaults: Intl.DateTimeFormatOptions,
  overrides?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  if (!overrides) {
    return defaults
  }

  const cleaned = Object.entries(overrides).reduce<Intl.DateTimeFormatOptions>(
    (acc, [key, val]) => {
      if (val !== undefined) {
        // @ts-expect-error dynamic assignment of Intl options
        acc[key] = val
      }
      return acc
    },
    {},
  )

  return { ...defaults, ...cleaned }
}

function formatWithOptions(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = coerceDate(value)
  if (!date) {
    return '—'
  }

  const locale = getPreferredLocale()
  return new Intl.DateTimeFormat(locale, options).format(date)
}

export function getPreferredLocale(fallback: string = DEFAULT_LOCALE): string {
  const stored = getLocalStorageItem(LOCALE_STORAGE_KEY, fallback)
  return stored || fallback
}

export function setPreferredLocale(locale: string | null | undefined): void {
  if (!locale) {
    removeLocalStorageItem(LOCALE_STORAGE_KEY)
    return
  }
  setLocalStorageItem(LOCALE_STORAGE_KEY, locale)
}

export function formatDate(
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatWithOptions(value, mergeOptions(DEFAULT_DATE_OPTIONS, options))
}

export function formatTime(
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatWithOptions(value, mergeOptions(DEFAULT_TIME_OPTIONS, options))
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatWithOptions(value, mergeOptions(DEFAULT_DATE_TIME_OPTIONS, options))
}

export function formatCurrencyValue(
  value: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const amount = typeof value === 'string' ? Number.parseFloat(value) : value
  if (!Number.isFinite(amount)) {
    return '—'
  }

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
