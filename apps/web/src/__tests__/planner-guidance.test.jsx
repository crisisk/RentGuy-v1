import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CountdownBadge, PersonaGuidance } from '../Planner.jsx'

const baseSummary = {
  active: 0,
  upcoming: 0,
  completed: 0,
  critical: 0,
  atRisk: 0,
}

describe('CountdownBadge', () => {
  it('labels completed events as afgerond', () => {
    render(<CountdownBadge event={{ status: 'completed' }} />)
    expect(screen.getByText('Afgerond')).toBeInTheDocument()
  })

  it('highlights urgent stock checks for at-risk events', () => {
    render(<CountdownBadge event={{ status: 'at_risk', daysUntilStart: 2 }} />)
    expect(screen.getByText('Controle binnen 2 d')).toBeInTheDocument()
  })

  it('shows relative countdown for upcoming projects', () => {
    render(<CountdownBadge event={{ status: 'upcoming', daysUntilStart: 5 }} />)
    expect(screen.getByText('Binnen 5 d')).toBeInTheDocument()
  })

  it('indicates unknown planning when days until start is missing', () => {
    render(<CountdownBadge event={{ status: 'upcoming' }} />)
    expect(screen.getByText('Planning onbekend')).toBeInTheDocument()
  })
})

describe('PersonaGuidance', () => {
  it('renders focus, checklist and dynamic insight for Bart persona', () => {
    const summary = { ...baseSummary, active: 3, critical: 1 }
    render(<PersonaGuidance personaKey="bart" summary={summary} />)

    expect(
      screen.getByText('Geen kritieke voorraadblokkades op lopende projecten.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Gebruik het risicofilter om kritieke meldingen eerst te zien.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Let op: 1 project(en) wachten op voorraadopvolging.')).toBeInTheDocument()
  })

  it('returns null when persona key is unknown', () => {
    const { container } = render(<PersonaGuidance personaKey="unknown" summary={baseSummary} />)
    expect(container.firstChild).toBeNull()
  })
})
