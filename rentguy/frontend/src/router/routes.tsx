import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteConfig } from './types';

// Lazy load all page components
const LoginPage = lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.default })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.default })));
const ProjectOverview = lazy(() => import('@/pages/ProjectOverview').then(module => ({ default: module.default })));
const VisualPlanner = lazy(() => import('@/pages/VisualPlanner').then(module => ({ default: module.default })));
const CrewManagement = lazy(() => import('@/pages/CrewManagement').then(module => ({ default: module.default })));
const TimeApproval = lazy(() => import('@/pages/TimeApproval').then(module => ({ default: module.default })));
const EquipmentInventory = lazy(() => import('@/pages/EquipmentInventory').then(module => ({ default: module.default })));
const FinanceDashboard = lazy(() => import('@/pages/FinanceDashboard').then(module => ({ default: module.default })));
const InvoiceOverview = lazy(() => import('@/pages/InvoiceOverview').then(module => ({ default: module.default })));
const QuoteManagement = lazy(() => import('@/pages/QuoteManagement').then(module => ({ default: module.default })));
const CRMDashboard = lazy(() => import('@/pages/CRMDashboard').then(module => ({ default: module.default })));
const CustomerDetails = lazy(() => import('@/pages/CustomerDetails').then(module => ({ default: module.default })));
const UserManagement = lazy(() => import('@/pages/UserManagement').then(module => ({ default: module.default })));
const SystemSettings = lazy(() => import('@/pages/SystemSettings').then(module => ({ default: module.default })));
const ReportsAnalytics = lazy(() => import('@/pages/ReportsAnalytics').then(module => ({ default: module.default })));
const MollieAdminDashboard = lazy(() => import('@/pages/MollieAdminDashboard').then(module => ({ default: module.default })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(module => ({ default: module.default })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(module => ({ default: module.default })));

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

