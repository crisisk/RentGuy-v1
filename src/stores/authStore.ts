import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AuthUser } from '@application/auth/api'
import { getStoredToken } from '@core/auth-token-storage'

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'error'

interface AuthBaseState {
  user: AuthUser | null
  token: string | null
  status: AuthStatus
  error: string | null
  lastCheckedAt: string | null
}

export interface AuthStoreState extends AuthBaseState {
  setCredentials(token: string, user: AuthUser | null): void
  clear(): void
  markChecking(): void
  markError(message: string): void
  syncToken(token: string | null): void
}

function getTimestamp(): string {
  return new Date().toISOString()
}

function createInitialState(): AuthBaseState {
  const initialToken = getStoredToken().trim()
  return {
    user: null,
    token: initialToken ? initialToken : null,
    status: initialToken ? 'checking' : 'idle',
    error: null,
    lastCheckedAt: null,
  }
}

export const useAuthStore = create<AuthStoreState>(
  immer((set) => ({
    ...createInitialState(),
    setCredentials: (token, user) => {
      const normalisedToken = token.trim()
      set((draft) => {
        draft.token = normalisedToken || null
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
          draft.user = null
          draft.token = null
          draft.status = 'idle'
          draft.error = null
          draft.lastCheckedAt = null
        }
      })
    },
  })),
)

export function resetAuthStore(): void {
  const base = createInitialState()
  useAuthStore.setState((draft) => {
    draft.user = base.user
    draft.token = base.token
    draft.status = base.status
    draft.error = base.error
    draft.lastCheckedAt = base.lastCheckedAt
  })
}
