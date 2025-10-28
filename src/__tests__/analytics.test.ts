import { beforeEach, describe, expect, it } from 'vitest'

import {
  BUFFER_LIMIT,
  DATA_LAYER_LIMIT,
  getBufferedEvents,
  resetAnalyticsState,
  track,
  type AnalyticsDataLayer,
} from '../utils/analytics'

describe('analytics track helper', () => {
  beforeEach(() => {
    resetAnalyticsState()
  })

  it('pushes formatted events to the provided dataLayer', () => {
    const dataLayer: AnalyticsDataLayer = []

    const event = track(
      'rentguy.onboarding.step_completed',
      {
        context: { tenantId: 'tenant-1', module: 'onboarding' },
        properties: { stepCode: 'kickoff', durationMs: 4200 },
      },
      { dataLayer },
    )

    expect(dataLayer.length).toBe(1)
    expect(dataLayer[0]?.event).toBe('rentguy.onboarding.step_completed')
    expect(dataLayer[0]?.context).toEqual({ tenantId: 'tenant-1', module: 'onboarding' })
    expect(dataLayer[0]?.properties).toEqual({ stepCode: 'kickoff', durationMs: 4200 })
    expect(typeof event.eventId).toBe('string')
    expect(event.timestamp.includes('T')).toBe(true)
  })

  it('buffers events when no dataLayer is available', () => {
    const event = track('rentguy.test.buffered', {
      properties: { foo: 'bar' },
    })

    const buffered = getBufferedEvents()
    expect(buffered.length).toBe(1)
    expect(buffered[0]?.event).toBe('rentguy.test.buffered')
    expect(buffered[0]?.properties).toEqual({ foo: 'bar' })
    expect(buffered[0]?.eventId).toBe(event.eventId)
  })

  it('caps buffered events to the configured limit to avoid overflow', () => {
    for (let index = 0; index < BUFFER_LIMIT + 5; index += 1) {
      track(`rentguy.buffer.event_${index}`)
    }

    const buffered = getBufferedEvents()
    expect(buffered.length).toBe(BUFFER_LIMIT)
    expect(buffered[0]?.event).toBe(`rentguy.buffer.event_${5}`)
    expect(buffered[buffered.length - 1]?.event).toBe(`rentguy.buffer.event_${BUFFER_LIMIT + 4}`)
  })

  it('keeps the dataLayer trimmed when it grows beyond the limit', () => {
    const dataLayer: AnalyticsDataLayer = []

    for (let index = 0; index < DATA_LAYER_LIMIT + 10; index += 1) {
      track(`rentguy.layer.event_${index}`, {}, { dataLayer })
    }

    expect(dataLayer.length).toBe(DATA_LAYER_LIMIT)
    expect(dataLayer[0]?.event).toBe(`rentguy.layer.event_${10}`)
    expect(dataLayer[dataLayer.length - 1]?.event).toBe(
      `rentguy.layer.event_${DATA_LAYER_LIMIT + 9}`,
    )
  })
})
