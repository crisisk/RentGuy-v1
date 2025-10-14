import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteConfig } from './types';

// Lazy load all page components
const LoginPage = lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ProjectOverview = lazy(() => import('@/pages/ProjectOverview').then(module => ({ default: module.ProjectOverview })));
const VisualPlanner = lazy(() => import('@/pages/VisualPlanner').then(module => ({ default: module.VisualPlanner })));
const CrewManagement = lazy(() => import('@/pages/CrewManagement').then(module => ({ default: module.CrewManagement })));
const TimeApproval = lazy(() => import('@/pages/TimeApproval').then(module => ({ default: module.TimeApproval })));
const EquipmentInventory = lazy(() => import('@/pages/EquipmentInventory').then(module => ({ default: module.EquipmentInventory })));
const FinanceDashboard = lazy(() => import('@/pages/FinanceDashboard').then(module => ({ default: module.FinanceDashboard })));
const InvoiceOverview = lazy(() => import('@/pages/InvoiceOverview').then(module => ({ default: module.InvoiceOverview })));
const QuoteManagement = lazy(() => import('@/pages/QuoteManagement').then(module => ({ default: module.QuoteManagement })));
const CRMDashboard = lazy(() => import('@/pages/CRMDashboard').then(module => ({ default: module.CRMDashboard })));
const CustomerDetails = lazy(() => import('@/pages/CustomerDetails').then(module => ({ default: module.CustomerDetails })));
const UserManagement = lazy(() => import('@/pages/UserManagement').then(module => ({ default: module.UserManagement })));
const SystemSettings = lazy(() => import('@/pages/SystemSettings').then(module => ({ default: module.SystemSettings })));
const ReportsAnalytics = lazy(() => import('@/pages/ReportsAnalytics').then(module => ({ default: module.ReportsAnalytics })));
const MollieAdminDashboard = lazy(() => import('@/pages/MollieAdminDashboard').then(module => ({ default: module.MollieAdminDashboard })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })));

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
    element: <FinanceDashboard />,
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
