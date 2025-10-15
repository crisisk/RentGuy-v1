import type { AuthUser } from '@application/auth/api'
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
}

function getTimestamp(): string {
  return new Date().toISOString()
}

export const authStore = createStore<AuthStoreState>((set) => ({
  user: null,
  token: null,
  status: 'idle',
  error: null,
  lastCheckedAt: null,
  setCredentials: (token, user) => {
    set((draft) => {
      draft.token = token
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
}))

export const useAuthStore = authStore.useStore
