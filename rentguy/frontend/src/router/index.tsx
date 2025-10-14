import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';

/**
 * Configured application router with React Router v6
 * Integrates with Zustand store and TypeScript typings
 */
export const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});

/**
 * TEST SCENARIOS:
 * 
 * 1. Navigation Test:
 * - Verify all 14 routes resolve correctly
 * - Check parameterized route (/aanbod/:id) with different IDs
 * 
 * 2. Error Handling Test:
 * - Throw error in page component to test ErrorBoundary
 * - Test 404 handling for unknown routes
 * 
 * 3. Performance Test:
 * - Verify code splitting works via Network tab
 * - Check loading spinner appears during lazy loading
 * 
 * 4. Accessibility Test:
 * - Validate ARIA labels in loading/error states
 * - Test keyboard navigation and screen reader compatibility
 * 
 * 5. Mobile Responsiveness:
 * - Test all pages on different screen sizes
 * - Verify Tailwind breakpoints work correctly
 * 
 * 6. Security Test:
 * - Validate authenticated route protection
 * - Test navigation guards (implemented in Zustand)
 */