// FILE: rentguy/frontend/src/router/routes.tsx
import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteConfig } from './types';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const appRoutes: RouteConfig[] = [
  { index: true, element: <Navigate to="/dashboard" replace /> },
  { path: 'login', element: <LoginPage />, guard: 'public' },
  {
    path: 'dashboard',
    element: <DashboardPage />,
    guard: 'auth',
    allowedRoles: ['user', 'admin']
  },
  {
    path: 'admin',
    element: <AdminPage />,
    guard: 'auth',
    allowedRoles: ['admin']
  },
  {
    path: 'profile',
    element: <ProfilePage />,
    guard: 'auth'
  },
  { path: 'not-found', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/not-found" replace /> }
];

// FILE: rentguy/frontend/src/router/guards.tsx
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authStore } from '@/stores/auth';
import type { ReactNode } from 'react';

export const AuthGuard = ({
  children,
  allowedRoles
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) => {
  const { token, user, validateSession } = authStore();

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/not-found" replace />;

  return children;
};

// FILE: rentguy/frontend/src/router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { appRoutes } from './routes';
import { processRoutes } from './utils';
import type { RouteObject } from 'react-router-dom';
import type { RouteConfig } from './types';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: processRoutes(appRoutes)
  }
]);

export const AppRouter = () => <RouterProvider router={router} />;

// FILE: rentguy/frontend/src/router/types.ts
import type { ReactNode } from 'react';

export interface RouteConfig {
  path?: string;
  index?: boolean;
  element: ReactNode;
  guard?: 'public' | 'auth';
  allowedRoles?: string[];
  children?: RouteConfig[];
}

// FILE: rentguy/frontend/src/router/utils.ts
import { AuthGuard } from './guards';
import type { RouteConfig, RouteObject } from './types';

export const processRoutes = (routes: RouteConfig[]): RouteObject[] => {
  return routes.map((route) => {
    let element = route.element;

    if (route.guard === 'auth') {
      element = <AuthGuard allowedRoles={route.allowedRoles}>{element}</AuthGuard>;
    }

    return {
      path: route.path,
      index: route.index,
      element,
      children: route.children ? processRoutes(route.children) : undefined
    };
  });
};