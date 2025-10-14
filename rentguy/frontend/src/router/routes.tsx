import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * Error boundary component to catch and display runtime errors
 * Implements React error boundary with Dutch localization
 */
class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error Boundary:', error, info);
    // Log error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="p-4 bg-red-50 border-l-4 border-red-400" 
          role="alert"
          aria-live="assertive"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-medium text-red-800">Er is een fout opgetreden</h2>
              <p className="mt-2 text-sm text-red-700">
                Probeer de pagina te verversen. Blijft het probleem bestaan? Neem contact op met onze support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading spinner component with accessibility features
 * Implements mobile-responsive design with Tailwind CSS
 */
const LoadingSpinner = () => (
  <div 
    className="flex justify-center items-center min-h-screen bg-gray-50"
    role="status"
    aria-label="Pagina wordt geladen"
  >
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
  </div>
);

/**
 * Lazy-loaded page components with TypeScript typing
 * Each import includes proper Mobile Responsive and RentGuy styling
 */
const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const PropertyListPage = lazy(() => import('../pages/PropertyListPage'));
const PropertyDetailsPage = lazy(() => import('../pages/PropertyDetailsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AddPropertyPage = lazy(() => import('../pages/AddPropertyPage'));
const MessagesPage = lazy(() => import('../pages/MessagesPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const HelpPage = lazy(() => import('../pages/HelpPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

/**
 * Route configuration factory function
 * Ensures consistent error boundaries and loading states
 */
const createRoute = (
  path: string,
  Component: React.LazyExoticComponent<React.ComponentType>
): RouteObject => ({
  path,
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </Suspense>
  )
});

/**
 * Complete route configuration for RentGuy application
 * Includes all 14 pages with proper Dutch localization
 */
export const routes: RouteObject[] = [
  createRoute('/', HomePage),
  createRoute('/inloggen', LoginPage),
  createRoute('/registreren', RegisterPage),
  createRoute('/aanbod', PropertyListPage),
  createRoute('/aanbod/:id', PropertyDetailsPage),
  createRoute('/dashboard', DashboardPage),
  createRoute('/dashboard/toevoegen', AddPropertyPage),
  createRoute('/berichten', MessagesPage),
  createRoute('/profiel', ProfilePage),
  createRoute('/instellingen', SettingsPage),
  createRoute('/favorieten', FavoritesPage),
  createRoute('/meldingen', NotificationsPage),
  createRoute('/help', HelpPage),
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorBoundary>
          <NotFoundPage />
        </ErrorBoundary>
      </Suspense>
    )
  }
];