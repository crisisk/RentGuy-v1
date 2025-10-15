import type { AuthUser } from '@application/auth/api'
import { getStoredToken } from '@core/auth-token-storage'
import { createStore } from './storeFactory'

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'error'

export interface AuthStoreState {
  user: AuthUser | null
  token: string | null
  status: AuthStatus
  error: string | null
  lastCheckedAt: string | null
  setCredentials(token: string, user: AuthUser | null): void
  clear(): void
  markChecking(): void
  markError(message: string): void
  syncToken(token: string | null): void
}

function getTimestamp(): string {
  return new Date().toISOString()
}

const initialToken = getStoredToken().trim()

export const authStore = createStore<AuthStoreState>((set) => ({
  user: null,
  token: initialToken ? initialToken : null,
  status: initialToken ? 'checking' : 'idle',
  error: null,
  lastCheckedAt: null,
  setCredentials: (token, user) => {
    set((draft) => {
      draft.token = token.trim() || null
      draft.user = user
      draft.status = 'authenticated'
      draft.error = null
      draft.lastCheckedAt = getTimestamp()
    })
  },
  clear: () => {
    set((draft) => {
      draft.user = null
      draft.token = null
      draft.status = 'idle'
      draft.error = null
      draft.lastCheckedAt = null
    })
  },
  markChecking: () => {
    set((draft) => {
      draft.status = 'checking'
      draft.error = null
      draft.lastCheckedAt = getTimestamp()
    })
  },
  markError: (message) => {
    set((draft) => {
      draft.status = 'error'
      draft.error = message
      draft.lastCheckedAt = getTimestamp()
    })
  },
  syncToken: (token) => {
    set((draft) => {
      const trimmed = typeof token === 'string' ? token.trim() : ''
      if (trimmed) {
        draft.token = trimmed
        draft.status = 'checking'
        draft.error = null
        draft.lastCheckedAt = getTimestamp()
      } else {
        draft.token = null
        draft.user = null
        draft.status = 'idle'
        draft.error = null
        draft.lastCheckedAt = null
      }
    })
  },
}))

export const useAuthStore = authStore.useStore
