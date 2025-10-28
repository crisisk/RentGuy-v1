export interface AnalyticsTrackPayload extends Record<string, unknown> {
  channel?: string
  legacyEvent?: string
}

type WindowWithDataLayer = typeof window & {
  dataLayer?: Array<Record<string, unknown>>
}

const defaultChannel = 'app'

const logAnalyticsError = (error: unknown) => {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn('Kon analytics event niet versturen', error)
  }
}

const pushToDataLayer = (detail: Record<string, unknown>, legacyEvent?: string) => {
  const candidate = window as WindowWithDataLayer
  if (!Array.isArray(candidate.dataLayer)) {
    return
  }

  const eventName = legacyEvent
    ? `rentguy_${legacyEvent}`
    : typeof detail.event === 'string'
      ? detail.event
      : 'rentguy_event'
  candidate.dataLayer.push({ event: eventName, ...detail })
}

const dispatchBrowserEvents = (
  event: string,
  detail: Record<string, unknown>,
  channel: string,
  legacyEvent?: string,
) => {
  window.dispatchEvent(new CustomEvent('rentguy:analytics', { detail }))

  if (legacyEvent) {
    window.dispatchEvent(new CustomEvent(`rentguy:${legacyEvent}`, { detail }))
  }

  if (channel === 'onboarding') {
    const onboardingDetail = {
      type: legacyEvent ?? event,
      timestamp: detail.timestamp,
      ...detail,
    }
    window.dispatchEvent(new CustomEvent('rentguy:onboarding', { detail: onboardingDetail }))
  }
}

export const analytics = {
  track(event: string, payload: AnalyticsTrackPayload = {}) {
    const { channel = defaultChannel, legacyEvent, ...rest } = payload
    const timestamp = new Date().toISOString()
    const detail: Record<string, unknown> = { event, channel, timestamp, ...rest }

    if (typeof window !== 'undefined') {
      try {
        dispatchBrowserEvents(event, detail, channel, legacyEvent)
        pushToDataLayer(detail, legacyEvent)
      } catch (error) {
        logAnalyticsError(error)
      }
    }

    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      console.info('[analytics]', event, detail)
    }
  },
}

type Analytics = typeof analytics

export type AnalyticsClient = Analytics
