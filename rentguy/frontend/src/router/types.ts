import type { ReactNode } from 'react';
import type { RouteObject as ReactRouterRouteObject } from 'react-router-dom';

export interface RouteConfig {
  path?: string;
  index?: boolean;
  element: ReactNode;
  guard?: 'public' | 'auth';
  allowedRoles?: string[];
  children?: RouteConfig[];
}

export type RouteObject = ReactRouterRouteObject;

