import type { ReactNode } from 'react'
import { brand } from '@ui/branding'
import type { FlowExperienceNavRailItem, FlowNavigationStatus } from '@ui/FlowExperienceNavRail'
export type { FlowNavigationStatus } from '@ui/FlowExperienceNavRail'

export type FlowNavigationKey = 'login' | 'role' | 'planner' | 'secrets'

const FLOW_ORDER: FlowNavigationKey[] = ['login', 'role', 'planner', 'secrets']

const FLOW_DEFINITIONS: Record<FlowNavigationKey, Omit<FlowExperienceNavRailItem, 'id' | 'status'>> = {
  login: {
    label: 'Inloggen',
    description: 'Activeer uw pilottoegang of gebruik een demo-account.',
    href: '/login',
    icon: '🔐',
    badge: 'Stap 1',
  },
  role: {
    label: 'Rol bevestigen',
    description: 'Selecteer uw rol om relevante hulp en dashboards te activeren.',
    href: '/planner#persona',
    icon: '🧭',
    badge: 'Stap 2',
  },
  planner: {
    label: 'Planner cockpit',
    description: 'Stuur projecten, crew en materiaal vanuit één overzicht.',
    href: '/planner',
    icon: '🗓️',
    badge: 'Stap 3',
  },
  secrets: {
    label: 'Governance & secrets',
    description: 'Controleer integraties, monitoring en go-live ready checks.',
    href: '/dashboard',
    icon: '🛡️',
    badge: 'Stap 4',
  },
}

export function createFlowNavigation(
  current: FlowNavigationKey,
  overrides: Partial<Record<FlowNavigationKey, FlowNavigationStatus>> = {},
  meta: Partial<Record<FlowNavigationKey, ReactNode>> = {},
): FlowExperienceNavRailItem[] {
  const currentIndex = FLOW_ORDER.indexOf(current)

  return FLOW_ORDER.map((key, index) => {
    let status: FlowNavigationStatus
    if (index < currentIndex) {
      status = 'complete'
    } else if (index === currentIndex) {
      status = 'current'
    } else {
      status = 'upcoming'
    }

    if (overrides[key]) {
      status = overrides[key] as FlowNavigationStatus
    }

    const definition = FLOW_DEFINITIONS[key]

    return {
      id: key,
      status,
      ...definition,
      meta: meta[key],
    }
  })
}

export function describeFlowStatus(status: FlowNavigationStatus): string {
  switch (status) {
    case 'complete':
      return 'Workflow is afgerond'
    case 'current':
      return 'Workflow is actief'
    case 'blocked':
      return 'Workflow is geblokkeerd tot de voorwaarden zijn vervuld'
    default:
      return 'Workflow staat gepland als volgende stap'
  }
}

export function resolveFlowTone(status: FlowNavigationStatus): string {
  switch (status) {
    case 'complete':
      return brand.colors.success
    case 'current':
      return brand.colors.primary
    case 'blocked':
      return brand.colors.danger
    default:
      return brand.colors.secondary
  }
}
