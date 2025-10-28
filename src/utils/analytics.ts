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
  legacyEvent?: string
}

export type AnalyticsDataLayer = AnalyticsEventDetail[]

interface WindowWithDataLayer extends Window {
  dataLayer?: AnalyticsDataLayer
}

const defaultChannel = 'app'
export const BUFFER_LIMIT = 100
export const DATA_LAYER_LIMIT = 300

let bufferedEvents: AnalyticsEventDetail[] = []

const logAnalyticsError = (error: unknown) => {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn('Kon analytics event niet versturen', error)
  }
}

const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getWindow = (): WindowWithDataLayer | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return window as WindowWithDataLayer
}

const ensureDataLayer = (candidate?: AnalyticsDataLayer): AnalyticsDataLayer | null => {
  if (candidate) {
    return candidate
  }
  const win = getWindow()
  if (!win) {
    return null
  }
  if (!Array.isArray(win.dataLayer)) {
    win.dataLayer = []
  }
  return win.dataLayer
}

const trimToLimit = (collection: AnalyticsDataLayer, limit: number) => {
  if (collection.length > limit) {
    collection.splice(0, collection.length - limit)
  }
}

const dispatchBrowserEvents = (
  event: string,
  detail: AnalyticsEventDetail,
  channel: string,
  legacyEvent?: string,
) => {
  const win = getWindow()
  if (!win || typeof win.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') {
    return
  }

  win.dispatchEvent(new CustomEvent('rentguy:analytics', { detail }))

  if (legacyEvent) {
    win.dispatchEvent(new CustomEvent(`rentguy:${legacyEvent}`, { detail }))
  }

  if (channel === 'onboarding') {
    const onboardingDetail = {
      ...detail,
      type: legacyEvent ?? event,
    }
    win.dispatchEvent(new CustomEvent('rentguy:onboarding', { detail: onboardingDetail }))
  }
}

export const getBufferedEvents = (): AnalyticsEventDetail[] => [...bufferedEvents]

export const resetAnalyticsState = (options?: { dataLayer?: AnalyticsDataLayer }) => {
  bufferedEvents = []
  const targetLayer = ensureDataLayer(options?.dataLayer)
  if (targetLayer) {
    targetLayer.length = 0
  }
}

export interface TrackOptions {
  dataLayer?: AnalyticsDataLayer
}

export const track = (
  event: string,
  payload: AnalyticsTrackPayload = {},
  options: TrackOptions = {},
): AnalyticsEventDetail => {
  const { channel = defaultChannel, legacyEvent, context, properties, ...rest } = payload
  const eventRecord: AnalyticsEventDetail = {
    event,
    eventId: generateEventId(),
    timestamp: new Date().toISOString(),
    channel,
    ...(rest as Record<string, unknown>),
  }

  if (legacyEvent) {
    eventRecord.legacyEvent = legacyEvent
  }
  if (context) {
    eventRecord.context = context
  }
  if (properties) {
    eventRecord.properties = properties
  }

  const targetLayer = ensureDataLayer(options.dataLayer)

  if (targetLayer) {
    targetLayer.push(eventRecord)
    trimToLimit(targetLayer, DATA_LAYER_LIMIT)
  } else {
    bufferedEvents = [...bufferedEvents, eventRecord]
    if (bufferedEvents.length > BUFFER_LIMIT) {
      bufferedEvents = bufferedEvents.slice(bufferedEvents.length - BUFFER_LIMIT)
    }
  }

  try {
    dispatchBrowserEvents(event, eventRecord, channel, legacyEvent)
  } catch (error) {
    logAnalyticsError(error)
  }

  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info('[analytics]', event, eventRecord)
  }

  return eventRecord
}

export const analytics = {
  track,
}

type Analytics = typeof analytics

export type AnalyticsClient = Analytics
