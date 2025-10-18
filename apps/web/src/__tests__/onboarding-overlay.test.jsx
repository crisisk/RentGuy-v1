import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OnboardingOverlay from '../OnboardingOverlay.jsx'

const apiMock = vi.hoisted(() => ({
  getSteps: vi.fn(),
  getProgress: vi.fn(),
  completeStep: vi.fn(),
}))

vi.mock('../onbApi.js', () => apiMock)

const { getSteps, getProgress, completeStep } = apiMock

describe('OnboardingOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state and renders fetched steps with progress', async () => {
    getSteps.mockResolvedValueOnce([
      { code: 'setup', title: 'Setup', description: 'Start met de basis.' },
    ])
    getProgress.mockResolvedValueOnce([{ step_code: 'setup', status: 'complete' }])

    render(<OnboardingOverlay email="user@example.com" onClose={() => {}} />)

    expect(screen.getByText('Onboarding wordt geladen…')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Setup')).toBeInTheDocument())
    expect(screen.getByText('🎉 Gereed')).toBeInTheDocument()
    expect(screen.getByText('Voortgang: 100% (1/1 stappen)')).toBeInTheDocument()
  })

  it('allows retry when initial load fails', async () => {
    getSteps.mockRejectedValueOnce(new Error('Netwerkfout'))
    getProgress.mockRejectedValueOnce(new Error('Netwerkfout'))

    render(<OnboardingOverlay email="retry@example.com" onClose={() => {}} />)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Onboarding data kan niet geladen worden. Probeer het later opnieuw of contacteer Sevensa support. (Netwerkfout)',
      ),
    )
    expect(screen.getByRole('link', { name: 'Contacteer support' })).toHaveAttribute(
      'href',
      'mailto:support@sevensa.nl',
    )

    getSteps.mockResolvedValueOnce([
      { code: 'invite', title: 'Nodig team uit', description: 'Teamleden uitnodigen.' },
    ])
    getProgress.mockResolvedValueOnce([])

    await act(async () => {
      await userEvent.click(screen.getByText('Probeer opnieuw'))
    })

    await waitFor(() => expect(getSteps).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Nodig team uit')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('marks steps as complete and disables the button while updating', async () => {
    getSteps.mockResolvedValueOnce([
      { code: 'inventory', title: 'Importeer voorraad', description: 'Upload CSV.' },
      { code: 'plan', title: 'Plan event', description: 'Maak planning.' },
    ])
    getProgress.mockResolvedValueOnce([{ step_code: 'inventory', status: 'complete' }])
    getProgress.mockResolvedValueOnce([
      { step_code: 'inventory', status: 'complete' },
      { step_code: 'plan', status: 'complete' },
    ])
    completeStep.mockResolvedValueOnce({})

    render(<OnboardingOverlay email="planner@example.com" onClose={() => {}} />)

    const button = await screen.findByRole('button', { name: 'Markeer gereed' })

    await act(async () => {
      await userEvent.click(button)
    })

    await waitFor(() => expect(completeStep).toHaveBeenCalledWith('planner@example.com', 'plan'))

    await waitFor(() =>
      expect(screen.getByText('Voortgang: 100% (2/2 stappen)')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: 'Markeer gereed' })).not.toBeInTheDocument()
  })

  it('falls back to persona checklist when API returns no steps', async () => {
    getSteps.mockResolvedValueOnce([])
    getProgress.mockResolvedValueOnce([])

    render(<OnboardingOverlay email="finance.lead@rentguy.com" onClose={() => {}} />)

    await waitFor(() => expect(screen.getByText('Finance cockpit activeren')).toBeInTheDocument())
    expect(screen.getByText('Finance launch checklist')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Live onboardingdata is tijdelijk niet beschikbaar.')
  })
})
