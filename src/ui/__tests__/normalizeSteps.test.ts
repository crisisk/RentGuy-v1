import { describe, expect, it } from 'vitest'

import type { OnboardingStep } from '@application/onboarding/api'
import { normalizeSteps } from '../OnboardingOverlay'

function buildStep(partial: Partial<OnboardingStep>): OnboardingStep {
  return {
    code: '',
    title: '',
    description: '',
    ...partial,
  }
}

describe('normalizeSteps', () => {
  it('generates slugged codes from titles when missing', () => {
    const steps: OnboardingStep[] = [
      buildStep({ code: '', title: 'Kick-off Mister DJ' }),
      buildStep({ title: '  Crew & HR ' }),
    ]

    const result = normalizeSteps(steps)

    expect(result.map((step) => step.code)).toEqual(['kick-off-mister-dj', 'crew-hr'])
  })

  it('falls back to deterministic codes when no title is provided', () => {
    const steps: OnboardingStep[] = [
      buildStep({ description: 'empty', title: '' }),
      buildStep({ description: 'still empty', title: '' }),
    ]

    const result = normalizeSteps(steps)

    expect(result.map((step) => step.code)).toEqual(['step-0', 'step-1'])
  })

  it('ensures generated codes remain unique', () => {
    const steps: OnboardingStep[] = [
      buildStep({ code: 'duplicate', title: 'First' }),
      buildStep({ code: 'duplicate', title: 'Second' }),
      buildStep({ title: 'Duplicate' }),
      buildStep({ title: '', description: 'missing everything' }),
      buildStep({ title: '', description: 'another missing everything' }),
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
