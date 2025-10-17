import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load page components
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ProjectOverview = lazy(() => import('../pages/project/ProjectOverview'));
const ProjectDetails = lazy(() => import('../pages/project/ProjectDetails'));
const ProjectForm = lazy(() => import('../pages/project/ProjectForm'));
const CRMDashboard = lazy(() => import('../pages/crm/CRMDashboard'));
const CustomerList = lazy(() => import('../pages/crm/CustomerList'));
const CustomerDetails = lazy(() => import('../pages/crm/CustomerDetails'));
const CustomerForm = lazy(() => import('../pages/crm/CustomerForm'));
const CrewManagement = lazy(() => import('../pages/crew/CrewManagement'));
const ShiftSchedule = lazy(() => import('../pages/crew/ShiftSchedule'));
const TimeApproval = lazy(() => import('../pages/crew/TimeApproval'));
const FinanceDashboard = lazy(() => import('../pages/finance/FinanceDashboard'));
const InvoiceOverview = lazy(() => import('../pages/finance/InvoiceOverview'));
const InvoiceForm = lazy(() => import('../pages/finance/InvoiceForm'));
const QuoteManagement = lazy(() => import('../pages/finance/QuoteManagement'));
const AdminPanel = lazy(() => import('../pages/admin/AdminPanel'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const SystemSettings = lazy(() => import('../pages/settings/SystemSettings'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/projects',
    element: <ProjectOverview />
  },
  {
    path: '/projects/:id',
    element: <ProjectDetails />
  },
  {
    path: '/projects/new',
    element: <ProjectForm />
  },
  {
    path: '/crm',
    element: <CRMDashboard />
  },
  {
    path: '/crm/customers',
    element: <CustomerList />
  },
  {
    path: '/crm/customers/:id',
    element: <CustomerDetails />
  },
  {
    path: '/crm/customers/new',
    element: <CustomerForm />
  },
  {
    path: '/crew',
    element: <CrewManagement />
  },
  {
    path: '/crew/schedule',
    element: <ShiftSchedule />
  },
  {
    path: '/crew/time-approval',
    element: <TimeApproval />
  },
  {
    path: '/finance',
    element: <FinanceDashboard />
  },
  {
    path: '/finance/invoices',
    element: <InvoiceOverview />
  },
  {
    path: '/finance/invoices/new',
    element: <InvoiceForm />
  },
  {
    path: '/finance/quotes',
    element: <QuoteManagement />
  },
  {
    path: '/admin',
    element: <AdminPanel />
  },
  {
    path: '/admin/users',
    element: <UserManagement />
  },
  {
    path: '/settings',
    element: <SystemSettings />
  }
];

export default routes;
