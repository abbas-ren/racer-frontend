import { IconName } from 'lucide-react/dynamic';
import { type JSX } from 'react';

export interface Route {
  path: string;
  element: JSX.Element;
  name: string;
  isNested?: boolean;
  iconName?: IconName;
}

export type RouteMap = Record<string, string>;

export type NavMenuRoutes = {
  user: Route[];
  admin: Route[];
};
