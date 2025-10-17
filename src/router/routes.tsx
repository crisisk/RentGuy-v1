import React, { lazy, Suspense } from 'react';
import { 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

// Public Routes (Lazy Loaded)
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Protected Routes (Lazy Loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectOverview = lazy(() => import('./pages/projects/ProjectOverview'));
const ProjectDetails = lazy(() => import('./pages/projects/ProjectDetails'));
const CRMDashboard = lazy(() => import('./pages/crm/CRMDashboard'));
const CustomerDetails = lazy(() => import('./pages/crm/CustomerDetails'));
const CrewManagement = lazy(() => import('./pages/crew/CrewManagement'));
const TimeApproval = lazy(() => import('./pages/crew/TimeApproval'));
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const InvoiceOverview = lazy(() => import('./pages/finance/InvoiceOverview'));
const QuoteManagement = lazy(() => import('./pages/finance/QuoteManagement'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SystemSettings = lazy(() => import('./pages/settings/SystemSettings'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <ErrorBoundary>
              <Login />
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/register" 
          element={
            <ErrorBoundary>
              <Register />
            </ErrorBoundary>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <ErrorBoundary>
              <ForgotPassword />
            </ErrorBoundary>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ProjectOverview />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/projects/:id" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ProjectDetails />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/crm" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <CRMDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/crm/customers/:id" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <CustomerDetails />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/crew" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <CrewManagement />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/crew/time-approval" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <TimeApproval />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/finance" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <FinanceDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/finance/invoices" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <InvoiceOverview />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/finance/quotes" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <QuoteManagement />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminPanel />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <UserManagement />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <SystemSettings />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
```

Key features:
- Lazy loading for all route components
- Suspense with fallback spinner
- Error boundary for each route
- Protected routes wrapped with ProtectedRoute component
- Catch-all route redirecting to home
- TypeScript typing
- Modular and scalable structure

Note: This assumes you have companion components like `ProtectedRoute`, `ErrorBoundary`, and `Spinner` implemented in your project.
