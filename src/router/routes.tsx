import { createElement, lazy, type LazyExoticComponent, type ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'

type ComponentWithProps<P> = LazyExoticComponent<ComponentType<P>>

export interface AppRouteObject extends RouteObject {
  readonly requiresAuth: boolean
}

export interface CreateAppRoutesOptions {
  readonly onLogout: () => void
  readonly secretsFocusPath?: string
}

const PlannerPage = lazy(() => import('@ui/Planner')) as ComponentWithProps<{ onLogout: () => void }>
const SecretsDashboardPage = lazy(() => import('@ui/SecretsDashboard')) as ComponentWithProps<{ onLogout: () => void }>

function normaliseRoutePath(path?: string | null): string | null {
  if (!path) {
    return null
  }
  const trimmed = path.trim()
  if (!trimmed) {
    return null
  }
  const ensured = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return ensured.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
}

function createSecretsRoute(path: string, onLogout: () => void): AppRouteObject {
  return {
    path,
    requiresAuth: true,
    element: createElement(SecretsDashboardPage, { onLogout }),
  }
}

export function createAppRoutes({ onLogout, secretsFocusPath }: CreateAppRoutesOptions): AppRouteObject[] {
  const routes: AppRouteObject[] = [
    {
      path: '/planner',
      requiresAuth: true,
      element: createElement(PlannerPage, { onLogout }),
    },
    createSecretsRoute('/dashboard', onLogout),
  ]

  const resolvedSecretsPath = normaliseRoutePath(secretsFocusPath)
  if (resolvedSecretsPath && resolvedSecretsPath !== '/dashboard') {
    const exists = routes.some(route => route.path === resolvedSecretsPath)
    if (!exists) {
      routes.push(createSecretsRoute(resolvedSecretsPath, onLogout))
    }
  }

  return routes
}

export default createAppRoutes
