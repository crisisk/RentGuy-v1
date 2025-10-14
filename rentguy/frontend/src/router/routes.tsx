import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteConfig } from './types';

// Lazy load all page components
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectOverview = lazy(() => import('@/pages/ProjectOverview'));
const VisualPlanner = lazy(() => import('@/pages/VisualPlanner'));
const CrewManagement = lazy(() => import('@/pages/CrewManagement'));
const TimeApproval = lazy(() => import('@/pages/TimeApproval'));
const EquipmentInventory = lazy(() => import('@/pages/EquipmentInventory'));
const FinanceDashboard = lazy(() => import('@/pages/FinanceDashboard'));
const InvoiceOverview = lazy(() => import('@/pages/InvoiceOverview'));
const QuoteManagement = lazy(() => import('@/pages/QuoteManagement'));
const CRMDashboard = lazy(() => import('@/pages/CRMDashboard'));
const CustomerDetails = lazy(() => import('@/pages/CustomerDetails'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));
const ReportsAnalytics = lazy(() => import('@/pages/ReportsAnalytics'));
const MollieAdminDashboard = lazy(() => import('@/pages/MollieAdminDashboard'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Define all application routes
export const appRoutes: RouteConfig[] = [
  // Redirect root to dashboard
  { 
    index: true, 
    element: <Navigate to="/dashboard" replace /> 
  },
  
  // Public routes
  { 
    path: 'login', 
    element: <LoginPage />, 
    guard: 'public' 
  },
  
  // Protected routes
  {
    path: 'dashboard',
    element: <DashboardPage />,
    guard: 'auth'
  },
  {
    path: 'projects',
    element: <ProjectOverview />,
    guard: 'auth'
  },
  {
    path: 'planner',
    element: <VisualPlanner />,
    guard: 'auth'
  },
  {
    path: 'crew',
    element: <CrewManagement />,
    guard: 'auth'
  },
  {
    path: 'time-approval',
    element: <TimeApproval />,
    guard: 'auth'
  },
  {
    path: 'equipment',
    element: <EquipmentInventory />,
    guard: 'auth'
  },
  {
    path: 'finance',
    element: <DashboardPage />,
    guard: 'auth'
  },
  {
    path: 'invoices',
    element: <InvoiceOverview />,
    guard: 'auth'
  },
  {
    path: 'quotes',
    element: <QuoteManagement />,
    guard: 'auth'
  },
  {
    path: 'crm',
    element: <CRMDashboard />,
    guard: 'auth'
  },
  {
    path: 'customers/:id',
    element: <CustomerDetails />,
    guard: 'auth'
  },
  {
    path: 'users',
    element: <UserManagement />,
    guard: 'auth',
    allowedRoles: ['admin']
  },
  {
    path: 'settings',
    element: <SystemSettings />,
    guard: 'auth',
    allowedRoles: ['admin']
  },
  {
    path: 'reports',
    element: <ReportsAnalytics />,
    guard: 'auth'
  },
  {
    path: 'payments',
    element: <MollieAdminDashboard />,
    guard: 'auth',
    allowedRoles: ['admin', 'finance']
  },
  {
    path: 'profile',
    element: <ProfilePage />,
    guard: 'auth'
  },
  
  // Error pages
  { 
    path: 'not-found', 
    element: <NotFoundPage /> 
  },
  { 
    path: '*', 
    element: <Navigate to="/not-found" replace /> 
  }
];

