export interface AnalyticsContext {
  tenantId?: string
  userId?: string
  module?: string
  [key: string]: unknown
}

export interface AnalyticsProperties {
  [key: string]: unknown
}

export interface TrackPayload {
  context?: AnalyticsContext
  properties?: AnalyticsProperties
}

export interface TrackOptions {
  dataLayer?: AnalyticsDataLayer
  timestamp?: Date
  eventId?: string
}

export interface AnalyticsEvent {
  event: string
  eventId: string
  timestamp: string
  context: AnalyticsContext
  properties: AnalyticsProperties
}

export type AnalyticsDataLayer = Array<Record<string, unknown>>

const pendingEvents: AnalyticsEvent[] = []

export const BUFFER_LIMIT = 20
export const DATA_LAYER_LIMIT = 50

type WindowWithDataLayer = Window & { dataLayer?: unknown }

type CryptoLike = {
  randomUUID?: () => string
}

function resolveDataLayer(candidate?: AnalyticsDataLayer): AnalyticsDataLayer | null {
  if (candidate && Array.isArray(candidate)) {
    return candidate
  }

  if (typeof window === 'undefined') {
    return null
  }

  const withLayer = window as WindowWithDataLayer
  if (Array.isArray(withLayer.dataLayer)) {
    return withLayer.dataLayer as AnalyticsDataLayer
  }

  return null
}

function generateEventId(explicit?: string): string {
  if (explicit) {
    return explicit
  }

  const cryptoLike = globalThis.crypto as CryptoLike | undefined
  if (cryptoLike && typeof cryptoLike.randomUUID === 'function') {
    return cryptoLike.randomUUID()
  }

  return `evt_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

function trimInPlace<T>(items: T[], limit: number): void {
  if (items.length <= limit) {
    return
  }

  const excess = items.length - limit
  items.splice(0, excess)
}

function flushPendingEvents(target: AnalyticsDataLayer): void {
  if (pendingEvents.length === 0) {
    return
  }

  while (pendingEvents.length > 0) {
    const next = pendingEvents.shift()
    if (next) {
      target.push(next)
    }
  }
}

export function track(
  eventName: string,
  payload: TrackPayload = {},
  options: TrackOptions = {},
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    event: eventName,
    eventId: generateEventId(options.eventId),
    timestamp: (options.timestamp ?? new Date()).toISOString(),
    context: { ...(payload.context ?? {}) },
    properties: { ...(payload.properties ?? {}) },
  }

  const dataLayer = resolveDataLayer(options.dataLayer)
  if (dataLayer) {
    flushPendingEvents(dataLayer)
    dataLayer.push(event)
    trimInPlace(dataLayer, DATA_LAYER_LIMIT)
  } else {
    pendingEvents.push(event)
    trimInPlace(pendingEvents, BUFFER_LIMIT)
  }

  return event
}

export function getBufferedEvents(): AnalyticsEvent[] {
  return [...pendingEvents]
}

export function resetAnalyticsState(): void {
  pendingEvents.length = 0
}
