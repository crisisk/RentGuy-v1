import { describe, expect, it } from 'vitest'

import {
  computeOnboardingShouldShow,
  parseSnoozeTimestamp,
} from '../useOnboardingPreferences'

describe('parseSnoozeTimestamp', () => {
  it('returns null for empty values', () => {
    expect(parseSnoozeTimestamp('')).toBeNull()
    expect(parseSnoozeTimestamp('   ')).toBeNull()
    expect(parseSnoozeTimestamp(undefined)).toBeNull()
  })

  it('returns a number for valid timestamps', () => {
    const timestamp = Date.now() + 1_000
    expect(parseSnoozeTimestamp(String(timestamp))).toBe(timestamp)
  })

  it('ignores non-numeric values', () => {
    expect(parseSnoozeTimestamp('not-a-number')).toBeNull()
  })
})

describe('computeOnboardingShouldShow', () => {
  it('hides onboarding when already seen', () => {
    expect(computeOnboardingShouldShow(true, null, 0)).toBe(false)
  })

  it('hides onboarding when snoozed in the future', () => {
    expect(computeOnboardingShouldShow(false, 10_000, 1_000)).toBe(false)
  })

  it('shows onboarding when snooze expired', () => {
    expect(computeOnboardingShouldShow(false, 1_000, 10_000)).toBe(true)
  })

  it('shows onboarding when no snooze present', () => {
    expect(computeOnboardingShouldShow(false, null, 10_000)).toBe(true)
  })
})
