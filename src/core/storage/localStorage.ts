export interface StorageAPI {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const hasWindow = typeof window !== 'undefined'
const localStorageAvailable = hasWindow && typeof window.localStorage !== 'undefined'

function safeCall<T>(fn: () => T, fallback: T): T {
  if (!localStorageAvailable) return fallback
  try {
    return fn()
  } catch (error) {
    console.warn('LocalStorage access blocked', error)
    return fallback
  }
}

export function getLocalStorageItem(key: string, fallback = ''): string {
  return safeCall(() => window.localStorage.getItem(key) ?? fallback, fallback)
}

export function setLocalStorageItem(key: string, value: string | null | undefined): void {
  safeCall(() => {
    if (value === undefined || value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, value)
    }
  }, undefined)
}

export function removeLocalStorageItem(key: string): void {
  safeCall(() => window.localStorage.removeItem(key), undefined)
}

export function clearOnboardingState(): void {
  removeLocalStorageItem('onb_seen')
  removeLocalStorageItem('onb_snooze_until')
}

export const storageAvailable = localStorageAvailable
