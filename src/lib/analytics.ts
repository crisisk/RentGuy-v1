const MAX_DATALAYER_LENGTH = 300

export type AnalyticsEvent = 'task_completed' | 'task_started' | 'task_snoozed'

export interface AnalyticsPayload {
  taskId: string
  flow: string
  persona: string
  sourceComponent: string
  [key: string]: unknown
}

type DataLayerEntry = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: unknown
  }
}

const getWindow = (): Window | null => (typeof window === 'undefined' ? null : window)

const ensureDataLayer = (): DataLayerEntry[] | null => {
  const currentWindow = getWindow()
  if (!currentWindow) {
    console.warn('[analytics] window is not defined; skipping dataLayer push.')
    return null
  }

  if (currentWindow.dataLayer === undefined) {
    currentWindow.dataLayer = []
  }

  if (!Array.isArray(currentWindow.dataLayer)) {
    console.warn('[analytics] window.dataLayer is not an array; skipping dataLayer push.')
    return null
  }

  const dataLayer = currentWindow.dataLayer as DataLayerEntry[]

  if (dataLayer.length >= MAX_DATALAYER_LENGTH) {
    console.warn('[analytics] dataLayer reached maximum size; skipping push.')
    return null
  }

  return dataLayer
}

export const pushToDataLayer = (entry: DataLayerEntry): void => {
  const dataLayer = ensureDataLayer()

  if (!dataLayer) {
    return
  }

  dataLayer.push(entry)
}

export const track = (event: AnalyticsEvent, payload: AnalyticsPayload): void => {
  const entry: DataLayerEntry = {
    event,
    ...payload,
  }

  pushToDataLayer(entry)

  const currentWindow = getWindow()
  if (
    currentWindow &&
    typeof currentWindow.dispatchEvent === 'function' &&
    typeof CustomEvent === 'function'
  ) {
    const debugEvent = new CustomEvent('analytics:event', {
      detail: {
        event,
        payload,
      },
    })

    currentWindow.dispatchEvent(debugEvent)
  }
}
