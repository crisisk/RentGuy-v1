import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AuthUser } from '@application/auth/api'
import { isOfflineDemoToken } from '@application/auth/api'
import { removeLocalStorageItem } from '@core/storage'

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'offline' | 'error'

interface AuthStoreState {
  token: string | null
  user: AuthUser | null
  status: AuthStatus
  error: string | null
  setCredentials: (token: string, user: AuthUser) => void
  clear: () => void
  markChecking: () => void
  markError: (message: string) => void
  markOffline: (message?: string) => void
  syncToken: (token: string) => void
}

const INITIAL_STATE: Pick<AuthStoreState, 'token' | 'user' | 'status' | 'error'> = {
  token: null,
  user: null,
  status: 'idle',
  error: null,
}

const STORAGE_KEY = 'rg__auth_store_v1'
const MANUAL_LOGOUT_FLAG_KEY = 'rg__manual_logout_flag'

function isSessionStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function markManualLogoutFlag(): void {
  if (!isSessionStorageAvailable()) {
    return
  }
  try {
    window.sessionStorage.setItem(MANUAL_LOGOUT_FLAG_KEY, '1')
  } catch (error) {
    console.warn('Kon logout-flag niet opslaan', error)
  }
}

function consumeManualLogoutFlag(): boolean {
  if (!isSessionStorageAvailable()) {
    return false
  }
  try {
    const flag = window.sessionStorage.getItem(MANUAL_LOGOUT_FLAG_KEY)
    if (flag) {
      window.sessionStorage.removeItem(MANUAL_LOGOUT_FLAG_KEY)
      return true
    }
  } catch (error) {
    console.warn('Kon logout-flag niet lezen', error)
  }
  return false
}

const noopStorage: Storage = {
  get length() {
    return 0
  },
  clear() {
    // noop
  },
  getItem() {
    return null
  },
  key() {
    return null
  },
  removeItem() {
    // noop
  },
  setItem() {
    // noop
  },
}

function resolveStorage(): Storage {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return noopStorage
  }
  try {
    window.localStorage.removeItem('auth-storage')
  } catch (error) {
    console.warn('Kon legacy auth storage niet verwijderen', error)
  }
  return window.localStorage
}

function determineStatus(token: string | null, user: AuthUser | null): AuthStatus {
  if (!token) {
    return 'idle'
  }
  if (isOfflineDemoToken(token)) {
    return 'offline'
  }
  return user ? 'authenticated' : 'checking'
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    immer((set) => ({
      ...INITIAL_STATE,
      setCredentials: (token, user) => {
        const trimmed = token.trim()
        set((state) => {
          state.token = trimmed || null
          state.user = trimmed ? { ...user } : null
          state.status = determineStatus(state.token, state.user)
          state.error = null
        })
      },
      clear: () => {
        set((state) => {
          state.token = null
          state.user = null
          state.status = 'idle'
          state.error = null
        })
        removeLocalStorageItem('sessionToken')
      },
      markChecking: () => {
        set((state) => {
          state.status = 'checking'
          state.error = null
        })
      },
      markError: (message: string) => {
        set((state) => {
          state.status = 'error'
          state.error = message
        })
      },
      markOffline: (message?: string) => {
        set((state) => {
          state.status = 'offline'
          state.error = message ?? null
        })
      },
      syncToken: (token: string) => {
        const trimmed = token.trim()
        set((state) => {
          if (!trimmed) {
            const previousStatus = state.status
            state.token = null
            state.user = null
            state.status = 'idle'
            removeLocalStorageItem('sessionToken')
            const manualLogout = consumeManualLogoutFlag()
            if (manualLogout) {
              state.error = null
            } else if (
              previousStatus === 'authenticated' ||
              previousStatus === 'offline' ||
              previousStatus === 'checking'
            ) {
              state.error = 'Sessie verlopen. Log opnieuw in om verder te gaan.'
            }
            return
          }
          state.token = trimmed
          state.status = determineStatus(trimmed, state.user)
          if (state.status !== 'error') {
            state.error = null
          }
        })
      },
    })),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        status: state.status === 'error' || state.status === 'checking' ? 'idle' : state.status,
      }),
    },
  ),
)

export function resetAuthStore(): void {
  useAuthStore.setState({
    ...INITIAL_STATE,
  })
  const persistApi = (
    useAuthStore as typeof useAuthStore & { persist?: { clearStorage: () => Promise<void> } }
  ).persist
  if (persistApi?.clearStorage) {
    void persistApi.clearStorage()
  }
}

export function signalManualLogout(): void {
  markManualLogoutFlag()
}

export default useAuthStore
