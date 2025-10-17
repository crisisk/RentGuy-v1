import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './guards';
import routes from './routes';

const router = createBrowserRouter([
  {
    errorElement: (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Something went wrong!</h1>
        <p className="text-gray-600">Please try refreshing the page or contact support.</p>
      </div>
    ),
    children: [
      ...routes,
      {
        path: '*',
        element: (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-2">404 - Page Not Found</h1>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        )
      }
    ]
  }
]);

export default router;
