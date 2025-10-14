import { AuthGuard, PublicGuard } from './guards';
import type { RouteConfig } from './types';
import type { RouteObject } from 'react-router-dom';

export const processRoutes = (routes: RouteConfig[]): RouteObject[] => {
  return routes.map((route) => {
    let element = route.element;

    if (route.guard === 'auth') {
      element = <AuthGuard allowedRoles={route.allowedRoles}>{element}</AuthGuard>;
    } else if (route.guard === 'public') {
      element = <PublicGuard>{element}</PublicGuard>;
    }

    return {
      path: route.path,
      index: route.index,
      element,
      children: route.children ? processRoutes(route.children) : undefined
    };
  });
};

