import { describe, expect, it } from 'vitest'

import type { OnboardingStep } from '@application/onboarding/api'
import { normalizeSteps } from '../OnboardingOverlay'

describe('normalizeSteps', () => {
  it('generates slugged codes from titles when missing', () => {
    const steps: OnboardingStep[] = [
      { code: '', title: 'Kick-off Mister DJ', description: '' },
      { title: '  Crew & HR ', description: '' },
    ]

    const result = normalizeSteps(steps)

    expect(result.map((step) => step.code)).toEqual(['kick-off-mister-dj', 'crew-hr'])
  })

  it('falls back to deterministic codes when no title is provided', () => {
    const steps: OnboardingStep[] = [{ description: 'empty' }, { description: 'still empty' }]

    const result = normalizeSteps(steps)

    expect(result.map((step) => step.code)).toEqual(['step-0', 'step-1'])
  })

  it('ensures generated codes remain unique', () => {
    const steps: OnboardingStep[] = [
      { code: 'duplicate', title: 'First' },
      { code: 'duplicate', title: 'Second' },
      { title: 'Duplicate', description: '' },
      { description: 'missing everything' },
      { description: 'another missing everything' },
    ]

    const result = normalizeSteps(steps)

    expect(result.map((step) => step.code)).toEqual([
      'duplicate',
      'duplicate-1',
      'duplicate-2',
      'step-3',
      'step-4',
    ])
  })
})
