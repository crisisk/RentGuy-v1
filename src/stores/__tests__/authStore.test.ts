import { describe, expect, it, beforeEach } from 'vitest'
import type { AuthUser } from '@application/auth/api'
import { resetAuthStore, useAuthStore } from '@stores/authStore'

const demoUser: AuthUser = {
  id: 'demo-user',
  email: 'demo@example.com',
  role: 'planner',
}

describe('authStore', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  it('promotes credentials to authenticated state', () => {
    const state = useAuthStore.getState()
    state.setCredentials('token-123', demoUser)

    const next = useAuthStore.getState()
    expect(next.token).toBe('token-123')
    expect(next.user?.email).toBe('demo@example.com')
    expect(next.status).toBe('authenticated')
    expect(next.error).toBeNull()
  })

  it('clears state and resets to idle', () => {
    const state = useAuthStore.getState()
    state.setCredentials('token-123', demoUser)
    state.clear()

    const next = useAuthStore.getState()
    expect(next.token).toBeNull()
    expect(next.user).toBeNull()
    expect(next.status).toBe('idle')
  })
})
