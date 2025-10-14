import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { appRoutes } from './routes';
import { processRoutes } from './utils';

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    fontSize: '1rem',
    color: '#6B7280'
  }}>
    Loading...
  </div>
);

// Create the router with processed routes
export const router = createBrowserRouter(processRoutes(appRoutes));

// Export the router for use in main.tsx
export default router;

