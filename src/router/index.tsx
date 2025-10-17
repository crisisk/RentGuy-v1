import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { Guards } from './guards';
import ErrorPage from '../pages/ErrorPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Guards />,
    errorElement: <ErrorPage />,
    children: [
      ...routes,
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
