export interface AnalyticsTrackPayload extends Record<string, unknown> {
  channel?: string
  legacyEvent?: string
  context?: Record<string, unknown>
  properties?: Record<string, unknown>
}

export interface AnalyticsEventDetail extends Record<string, unknown> {
  event: string
  eventId: string
  timestamp: string
  channel: string
}

export type AnalyticsDataLayerEntry = Record<string, unknown>
export type AnalyticsDataLayer = AnalyticsDataLayerEntry[]

export interface TrackOptions {
  dataLayer?: AnalyticsDataLayer
  channel?: string
  legacyEvent?: string
}

export const BUFFER_LIMIT = 50
export const DATA_LAYER_LIMIT = 120

const defaultChannel = 'app'
export const BUFFER_LIMIT = 100
export const DATA_LAYER_LIMIT = 300

let bufferedEvents: AnalyticsEventDetail[] = []

let bufferedEvents: AnalyticsEventDetail[] = []

const getWindow = (): Window | undefined => (typeof window === 'undefined' ? undefined : window)

const ensureDataLayer = (provided?: AnalyticsDataLayer): AnalyticsDataLayer | undefined => {
  if (Array.isArray(provided)) {
    return provided
  }

  const candidate = getWindow()
  if (!candidate) {
    return undefined
  }

  if (!Array.isArray(candidate.dataLayer)) {
    candidate.dataLayer = []
  }

  return candidate.dataLayer as AnalyticsDataLayer
}

const logAnalyticsError = (error: unknown) => {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn('Kon analytics event niet versturen', error)
  }
}

const pushToBuffer = (event: AnalyticsEventDetail) => {
  bufferedEvents = [...bufferedEvents, event]
  if (bufferedEvents.length > BUFFER_LIMIT) {
    bufferedEvents = bufferedEvents.slice(bufferedEvents.length - BUFFER_LIMIT)
  }
}

const pushToDataLayer = (
  detail: AnalyticsEventDetail,
  dataLayer: AnalyticsDataLayer | undefined,
  legacyEvent?: string,
) => {
  const target = ensureDataLayer(dataLayer)
  if (!target) {
    return
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

  const eventName = legacyEvent
    ? `rentguy_${legacyEvent}`
    : typeof detail.event === 'string'
      ? detail.event
      : 'rentguy_event'

  target.push({ ...detail, event: eventName })

  if (target.length > DATA_LAYER_LIMIT) {
    target.splice(0, target.length - DATA_LAYER_LIMIT)
  }
}

const dispatchBrowserEvents = (detail: AnalyticsEventDetail, legacyEvent: string | undefined) => {
  const candidate = getWindow()
  if (!candidate) {
    return
  }

  try {
    candidate.dispatchEvent(new CustomEvent('rentguy:analytics', { detail }))

    if (legacyEvent) {
      candidate.dispatchEvent(new CustomEvent(`rentguy:${legacyEvent}`, { detail }))
    }

    if (detail.channel === 'onboarding') {
      const onboardingDetail = {
        type: legacyEvent ?? detail.event,
        ...detail,
      }
      candidate.dispatchEvent(new CustomEvent('rentguy:onboarding', { detail: onboardingDetail }))
    }
  } catch (error) {
    logAnalyticsError(error)
  }
}

export const getBufferedEvents = (): ReadonlyArray<AnalyticsEventDetail> => bufferedEvents.slice()

export const resetAnalyticsState = () => {
  bufferedEvents = []
}

export const track = (
  event: string,
  payload: AnalyticsTrackPayload = {},
  options: TrackOptions = {},
): AnalyticsEventDetail => {
  const { dataLayer, channel: optionChannel, legacyEvent: optionLegacyEvent } = options
  const { channel: payloadChannel, legacyEvent: payloadLegacyEvent, ...rest } = payload
  const channel = optionChannel ?? payloadChannel ?? defaultChannel
  const legacyEvent = optionLegacyEvent ?? payloadLegacyEvent
  const eventId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const timestamp = new Date().toISOString()
  const detail: AnalyticsEventDetail = { event, eventId, timestamp, channel, ...rest }

  if (!ensureDataLayer(dataLayer) && typeof window === 'undefined') {
    pushToBuffer(detail)
    return detail
  }

  pushToDataLayer(detail, dataLayer, legacyEvent)
  dispatchBrowserEvents(detail, legacyEvent)
  pushToBuffer(detail)

  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info('[analytics]', event, detail)
  }

  return detail
}

export const analytics = {
  track,
}

export type Analytics = typeof analytics
export type AnalyticsClient = Analytics
