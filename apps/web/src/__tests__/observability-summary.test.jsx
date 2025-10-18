import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ObservabilitySummary from '../ObservabilitySummary.jsx'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
  },
}))

let api

describe('ObservabilitySummary', () => {
  beforeEach(async () => {
    ;({ api } = await import('../api'))
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('renders metrics after a successful fetch', async () => {
    api.get.mockResolvedValue({
      data: {
        availability: 0.998,
        average_latency_ms: 120.5,
        uptime_human: '0d 2u 15m 10s',
        total_requests: 42,
        recent_requests: [
          { method: 'GET', path: '/healthz', status_code: 200, latency_ms: 5.1, timestamp: new Date().toISOString() },
        ],
        generated_at: new Date().toISOString(),
      },
    })

    render(<ObservabilitySummary refreshInterval={0} />)

    await waitFor(() => expect(screen.getByText('Service status')).toBeInTheDocument())
    expect(screen.getByText('99.8%')).toBeInTheDocument()
    expect(screen.getByText(/Gem. latency/)).toBeInTheDocument()
  })

  it('shows fallback when the API returns an error', async () => {
    api.get.mockRejectedValue(new Error('Network error'))

    render(<ObservabilitySummary refreshInterval={0} />)

    await waitFor(() =>
      expect(screen.getByText('Status niet beschikbaar')).toBeInTheDocument(),
    )
  })
})
