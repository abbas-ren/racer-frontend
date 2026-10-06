import { type JSX } from 'react';
import { type Route, type RouteMap } from 'typesCustom/routes';

export const generateRoutes = (base: string, routes: RouteMap): RouteMap =>
  Object.fromEntries(
    Object.entries(routes).map(([key, path]) => [key, `${base}/${path}`]),
  );

export const createRoute = (
  path: string,
  element: JSX.Element,
  name: string,
  isNested = false,
): Route => ({ path: `/${path}`, element, name, isNested });
