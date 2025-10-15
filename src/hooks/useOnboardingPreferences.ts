import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  clearOnboardingState,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '@core/storage'

const SEEN_KEY = 'onb_seen'
const SNOOZE_KEY = 'onb_snooze_until'

export interface OnboardingPreferencesState {
  readonly hasSeen: boolean
  readonly snoozeUntil: number | null
  readonly shouldShow: boolean
  readonly isSnoozed: boolean
  readonly refresh: () => void
  readonly markSeen: () => void
  readonly clearSeen: () => void
  readonly snooze: (durationMs?: number) => number
  readonly clearSnooze: () => void
  readonly reset: () => void
}

export function parseSnoozeTimestamp(value: string | null | undefined): number | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

export function computeOnboardingShouldShow(
  hasSeen: boolean,
  snoozeUntil: number | null,
  now: number = Date.now(),
): boolean {
  if (hasSeen) {
    return false
  }
  if (typeof snoozeUntil === 'number' && snoozeUntil > now) {
    return false
  }
  return true
}

function readSeenFlag(): boolean {
  return getLocalStorageItem(SEEN_KEY, '0') === '1'
}

function readSnoozeUntil(): number | null {
  const raw = getLocalStorageItem(SNOOZE_KEY, '')
  return parseSnoozeTimestamp(raw)
}

export function useOnboardingPreferences(defaultSnoozeMs: number): OnboardingPreferencesState {
  const defaultDuration = useRef(Math.max(defaultSnoozeMs, 0))
  const [hasSeen, setHasSeen] = useState(() => readSeenFlag())
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(() => readSnoozeUntil())

  const refresh = useCallback(() => {
    setHasSeen(readSeenFlag())
    setSnoozeUntil(readSnoozeUntil())
  }, [])

  const markSeen = useCallback(() => {
    setLocalStorageItem(SEEN_KEY, '1')
    removeLocalStorageItem(SNOOZE_KEY)
    setHasSeen(true)
    setSnoozeUntil(null)
  }, [])

  const clearSeen = useCallback(() => {
    removeLocalStorageItem(SEEN_KEY)
    setHasSeen(false)
  }, [])

  const clearSnooze = useCallback(() => {
    removeLocalStorageItem(SNOOZE_KEY)
    setSnoozeUntil(null)
  }, [])

  const snooze = useCallback(
    (durationMs?: number) => {
      const duration = typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0
        ? durationMs
        : defaultDuration.current
      const until = Date.now() + duration
      setLocalStorageItem(SNOOZE_KEY, String(until))
      setSnoozeUntil(until)
      return until
    },
    [],
  )

  const reset = useCallback(() => {
    clearOnboardingState()
    setHasSeen(false)
    setSnoozeUntil(null)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) {
        return
      }
      if (event.key === SEEN_KEY || event.key === SNOOZE_KEY) {
        refresh()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [refresh])

  const shouldShow = useMemo(() => computeOnboardingShouldShow(hasSeen, snoozeUntil), [hasSeen, snoozeUntil])

  const isSnoozed = useMemo(() => {
    if (typeof snoozeUntil !== 'number') {
      return false
    }
    return snoozeUntil > Date.now()
  }, [snoozeUntil])

  return {
    hasSeen,
    snoozeUntil,
    shouldShow,
    isSnoozed,
    refresh,
    markSeen,
    clearSeen,
    snooze,
    clearSnooze,
    reset,
  }
}
