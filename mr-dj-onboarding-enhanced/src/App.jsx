import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainNavigation from './components/MainNavigation'
import './App.css'

// Lazy load the onboarding wizard
const ImprovedOnboardingWizard = lazy(() => import('./components/ImprovedOnboardingWizard'))

// Lazy load all page components
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'))
const ProjectOverview = lazy(() => import('./pages/ProjectOverview'))
const CrewManagement = lazy(() => import('./pages/CrewManagement'))
const EquipmentInventory = lazy(() => import('./pages/EquipmentInventory'))
const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard'))
const InvoiceOverview = lazy(() => import('./pages/InvoiceOverview'))
const TimeApproval = lazy(() => import('./pages/TimeApproval'))
const QuoteManagement = lazy(() => import('./pages/QuoteManagement'))
const VisualPlanner = lazy(() => import('./pages/VisualPlanner'))
const CRMDashboard = lazy(() => import('./pages/CRMDashboard'))
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'))
const ReportsAnalytics = lazy(() => import('./pages/ReportsAnalytics'))
const SystemSettings = lazy(() => import('./pages/SystemSettings'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const MollieOverview = lazy(() => import('./pages/MollieOverview'))
const MolliePaymentFlow = lazy(() => import('./pages/MolliePaymentFlow'))
const MollieAdminDashboard = lazy(() => import('./pages/MollieAdminDashboard'))
const CrewMobileHome = lazy(() => import('./pages/CrewMobileHome'))
const CrewMobileShiftDetails = lazy(() => import('./pages/CrewMobileShiftDetails'))
const TimeRegistrationInterface = lazy(() => import('./pages/TimeRegistrationInterface'))
const TimeRegistrationApproval = lazy(() => import('./pages/TimeRegistrationApproval'))
const AvailabilityCalendar = lazy(() => import('./pages/AvailabilityCalendar'))
const DocumentManagementInterface = lazy(() => import('./pages/DocumentManagementInterface'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
      <p className="text-lg text-foreground font-semibold">Loading RentGuy...</p>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-background" data-testid="rentguy-app-shell">
        <Routes>
          {/* Onboarding route (no navigation) */}
          <Route
            path="/onboarding"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ImprovedOnboardingWizard />
              </Suspense>
            }
          />

          {/* Main application routes (with navigation) */}
          <Route
            path="/*"
            element={
              <div className="flex" data-testid="rentguy-app-layout">
                <MainNavigation />
                <div className="flex-1 ml-64" data-testid="rentguy-app-content">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<ExecutiveDashboard />} />
                      <Route path="/projects" element={<ProjectOverview />} />
                      <Route path="/crew" element={<CrewManagement />} />
                      <Route path="/equipment" element={<EquipmentInventory />} />
                      <Route path="/finance" element={<FinanceDashboard />} />
                      <Route path="/invoices" element={<InvoiceOverview />} />
                      <Route path="/time-approval" element={<TimeApproval />} />
                      <Route path="/quotes" element={<QuoteManagement />} />
                      <Route path="/planner" element={<VisualPlanner />} />
                      <Route path="/crm" element={<CRMDashboard />} />
                      <Route path="/customers/:id" element={<CustomerDetails />} />
                      <Route path="/reports" element={<ReportsAnalytics />} />
                      <Route path="/settings" element={<SystemSettings />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/mollie" element={<MollieOverview />} />
                      <Route path="/mollie/flow" element={<MolliePaymentFlow />} />
                      <Route path="/mollie/admin" element={<MollieAdminDashboard />} />
                      <Route path="/crew/mobile" element={<CrewMobileHome />} />
                      <Route path="/crew/shift/:id" element={<CrewMobileShiftDetails />} />
                      <Route path="/time-registration" element={<TimeRegistrationInterface />} />
                      <Route
                        path="/time-registration/approval"
                        element={<TimeRegistrationApproval />}
                      />
                      <Route path="/availability" element={<AvailabilityCalendar />} />
                      <Route path="/documents" element={<DocumentManagementInterface />} />
                    </Routes>
                  </Suspense>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
