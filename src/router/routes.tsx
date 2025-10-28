import { createElement, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { RouteObject } from 'react-router-dom'

type LazyPage<P = Record<string, unknown>> = LazyExoticComponent<ComponentType<P>>

export interface AppRouteObject extends RouteObject {
  readonly requiresAuth?: boolean
}

export interface CreateAppRoutesOptions {
  readonly onLogout: () => void
  readonly secretsFocusPath?: string
}

const PlannerPage = lazy(() => import('@ui/Planner')) as LazyPage<{ onLogout: () => void }>
const SecretsDashboardPage = lazy(() => import('@ui/SecretsDashboard')) as LazyPage<{
  onLogout: () => void
}>

const OperationsDashboardPage = lazy(() => import('../pages/dashboard/Dashboard'))
const AdminPanelPage = lazy(() => import('../pages/admin/AdminPanel'))
const UserManagementPage = lazy(() => import('../pages/admin/UserManagement'))
const CrewManagementPage = lazy(() => import('../pages/crew/CrewManagement'))
const ShiftSchedulePage = lazy(() => import('../pages/crew/ShiftSchedule'))
const TimeApprovalPage = lazy(() => import('../pages/crew/TimeApproval'))
const CRMDashboardPage = lazy(() => import('../pages/crm/CRMDashboard'))
const ActivityLogPage = lazy(() => import('../pages/crm/ActivityLog'))
const CustomerListPage = lazy(() => import('../pages/crm/CustomerList'))
const CustomerFormPage = lazy(() => import('../pages/crm/CustomerForm'))
const CustomerDetailsPage = lazy(() => import('../pages/crm/CustomerDetails'))
const ProjectOverviewPage = lazy(() => import('../pages/project/ProjectOverview'))
const ProjectFormPage = lazy(() => import('../pages/project/ProjectForm'))
const ProjectDetailsPage = lazy(() => import('../pages/project/ProjectDetails'))
const ProjectTimelinePage = lazy(() => import('../pages/project/ProjectTimeline'))
const FinanceDashboardPage = lazy(() => import('../pages/finance/FinanceDashboard'))
const InvoiceOverviewPage = lazy(() => import('../pages/finance/InvoiceOverview'))
const InvoiceFormPage = lazy(() => import('../pages/finance/InvoiceForm'))
const QuoteManagementPage = lazy(() => import('../pages/finance/QuoteManagement'))
const SalesCRMSyncPage = lazy(() => import('../pages/sales/CRMSync'))
const SalesOffersPage = lazy(() => import('../pages/sales/SalesOffers'))
const SalesOfferPlaybookPage = lazy(() => import('../pages/sales/SalesOfferPlaybook'))
const SalesHandoffPage = lazy(() => import('../pages/sales/SalesHandoff'))
const SalesHandoffPlaybookPage = lazy(() => import('../pages/sales/SalesHandoffPlaybook'))
const SystemSettingsPage = lazy(() => import('../pages/settings/SystemSettings'))
const ErrorPage = lazy(() => import('../pages/ErrorPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

interface RouteDefinition<P = Record<string, unknown>> {
  readonly path: string
  readonly component: LazyPage<P>
  readonly requiresAuth?: boolean
  readonly getProps?: () => P
}

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

function createRoute<P>({
  path,
  component,
  requiresAuth = true,
  getProps,
}: RouteDefinition<P>): AppRouteObject {
  return {
    path,
    requiresAuth,
    element: createElement(component, getProps ? getProps() : ({} as P)),
  }
}

export function createAppRoutes({
  onLogout,
  secretsFocusPath,
}: CreateAppRoutesOptions): AppRouteObject[] {
  const baseDefinitions: RouteDefinition<any>[] = [
    {
      path: '/planner',
      component: PlannerPage,
      requiresAuth: true,
      getProps: () => ({ onLogout }),
    },
    {
      path: '/secrets',
      component: SecretsDashboardPage,
      requiresAuth: true,
      getProps: () => ({ onLogout }),
    },
    {
      path: '/dashboard',
      component: SecretsDashboardPage,
      requiresAuth: true,
      getProps: () => ({ onLogout }),
    },
    {
      path: '/operations/dashboard',
      component: OperationsDashboardPage,
      requiresAuth: true,
    },
    {
      path: '/admin',
      component: AdminPanelPage,
      requiresAuth: true,
    },
    {
      path: '/admin/users',
      component: UserManagementPage,
      requiresAuth: true,
    },
    {
      path: '/crew',
      component: CrewManagementPage,
      requiresAuth: true,
    },
    {
      path: '/crew/shifts',
      component: ShiftSchedulePage,
      requiresAuth: true,
    },
    {
      path: '/crew/time-approvals',
      component: TimeApprovalPage,
      requiresAuth: true,
    },
    {
      path: '/crm',
      component: CRMDashboardPage,
      requiresAuth: true,
    },
    {
      path: '/crm/activity',
      component: ActivityLogPage,
      requiresAuth: true,
    },
    {
      path: '/customers',
      component: CustomerListPage,
      requiresAuth: true,
    },
    {
      path: '/customers/new',
      component: CustomerFormPage,
      requiresAuth: true,
    },
    {
      path: '/customers/:customerId',
      component: CustomerDetailsPage,
      requiresAuth: true,
    },
    {
      path: '/projects',
      component: ProjectOverviewPage,
      requiresAuth: true,
    },
    {
      path: '/projects/new',
      component: ProjectFormPage,
      requiresAuth: true,
    },
    {
      path: '/projects/:projectId',
      component: ProjectDetailsPage,
      requiresAuth: true,
    },
    {
      path: '/projects/:projectId/timeline',
      component: ProjectTimelinePage,
      requiresAuth: true,
    },
    {
      path: '/finance',
      component: FinanceDashboardPage,
      requiresAuth: true,
    },
    {
      path: '/invoices',
      component: InvoiceOverviewPage,
      requiresAuth: true,
    },
    {
      path: '/invoices/new',
      component: InvoiceFormPage,
      requiresAuth: true,
    },
    {
      path: '/finance/quotes',
      component: QuoteManagementPage,
      requiresAuth: true,
    },
    {
      path: '/sales/crm-sync',
      component: SalesCRMSyncPage,
      requiresAuth: true,
    },
    {
      path: '/sales/offers',
      component: SalesOffersPage,
      requiresAuth: true,
    },
    {
      path: '/sales/offers/playbook',
      component: SalesOfferPlaybookPage,
      requiresAuth: true,
    },
    {
      path: '/sales/handoff',
      component: SalesHandoffPage,
      requiresAuth: true,
    },
    {
      path: '/sales/handoff/playbook',
      component: SalesHandoffPlaybookPage,
      requiresAuth: true,
    },
    {
      path: '/settings',
      component: SystemSettingsPage,
      requiresAuth: true,
    },
    {
      path: '/error',
      component: ErrorPage,
      requiresAuth: false,
    },
    {
      path: '/not-found',
      component: NotFoundPage,
      requiresAuth: false,
    },
  ]

  const resolvedSecretsPath = normaliseRoutePath(secretsFocusPath)
  if (
    resolvedSecretsPath &&
    resolvedSecretsPath !== '/secrets' &&
    resolvedSecretsPath !== '/dashboard'
  ) {
    baseDefinitions.push({
      path: resolvedSecretsPath,
      component: SecretsDashboardPage,
      requiresAuth: true,
      getProps: () => ({ onLogout }),
    })
  }

  const routes = new Map<string, AppRouteObject>()

  for (const definition of baseDefinitions) {
    const normalisedPath = normaliseRoutePath(definition.path)
    if (!normalisedPath) {
      continue
    }
    if (routes.has(normalisedPath)) {
      continue
    }
    routes.set(
      normalisedPath,
      createRoute({
        ...definition,
        path: normalisedPath,
      }),
    )
  }

  return Array.from(routes.values())
}

export default createAppRoutes
