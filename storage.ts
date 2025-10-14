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
    () => undefined
  )
}

export function removeLocalStorageItem(key: string): void {
  safeCall(
    () => {
      window.localStorage.removeItem(key)
      return undefined
    },
    () => undefined
  )
}

export function clearOnboardingState(): void {
  removeLocalStorageItem('onb_seen')
  removeLocalStorageItem('onb_snooze_until')
}

export const storageAvailable = hasLocalStorage
