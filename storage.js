const hasWindow = typeof window !== 'undefined'
const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined'

function safeCall(fn, fallback) {
  if (!hasLocalStorage) return fallback
  try {
    return fn()
  } catch (error) {
    console.warn('LocalStorage access blocked', error)
    return fallback
  }
}

export function getLocalStorageItem(key, fallback = '') {
  return safeCall(() => window.localStorage.getItem(key) ?? fallback, fallback)
}

export function setLocalStorageItem(key, value) {
  safeCall(() => {
    if (value === undefined || value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, value)
    }
  })
}

export function removeLocalStorageItem(key) {
  safeCall(() => window.localStorage.removeItem(key))
}

export function clearOnboardingState() {
  removeLocalStorageItem('onb_seen')
  removeLocalStorageItem('onb_snooze_until')
}

export const storageAvailable = hasLocalStorage
