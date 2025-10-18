import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { login, isOfflineDemoToken } from './api'
import { api } from '@infra/http/api'

vi.mock('@infra/http/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

const networkError = new AxiosError('Network Error', 'ERR_NETWORK')

describe('auth api offline safeguards', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
  })

  it('falls back to offline demo token when network is unavailable for known credentials', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(networkError)

    const result = await login({ email: 'bart@rentguy.demo', password: 'mr-dj' })

    expect(result.ok).toBe(true)
    expect(result.value.token).toBe('offline-demo-bart')
    expect(result.value.user.role).toBe('planner')
    expect(isOfflineDemoToken(result.value.token)).toBe(true)
  })

  it('preserves error result when credentials do not match offline catalogue', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(networkError)

    const result = await login({ email: 'bart@rentguy.demo', password: 'verkeerd' })

    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('network')
  })
})
