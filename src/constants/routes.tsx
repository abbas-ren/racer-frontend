import { lazy } from 'react';
// Lazy-loaded pages for route-level code splitting
const Login = lazy(() => import('pages/Login/Login'));
const Dashboard = lazy(() => import('pages/Admin/Dashboard/Dashboard'));
const Users = lazy(() => import('pages/Admin/Users/Users'));
const Devices = lazy(() => import('pages/User/Devices'));
const AdminBuilds = lazy(() => import('pages/Admin/Builds/Builds'));
const Configuration = lazy(
  () => import('pages/Admin/Configuration/Configuration'),
);
const Logs = lazy(() => import('pages/Admin/Logs/Logs'));
const UserDashboard = lazy(() => import('pages/User/Dashboard/Dashboard'));
const UserTests = lazy(() => import('pages/User/Tests/Tests'));
const UserDevices = lazy(() => import('pages/User/Devices'));
const UserBuilds = lazy(() => import('pages/User/Builds/Builds'));
const UserManual = lazy(() => import('pages/Common/UserManual/UserManual'));
import { type Route, type RouteMap } from 'typesCustom/routes';
import { createRoute, generateRoutes } from 'utils/route';

export const SIDEBAR_ROUTES: RouteMap = generateRoutes('home', {
  default: 'dashboard',
  users: 'users',
  devices: 'devices',
  configuration: 'configuration',
  logs: 'logs',
  builds: 'builds',
  tests: 'tests',
  manual: 'manual',
});

export const APP_SIDEBAR_ROUTES: Route[] = [
  {
    ...createRoute(SIDEBAR_ROUTES.default, <Dashboard />, 'Dashboard', false),
    iconName: 'layout-dashboard',
  },
  {
    ...createRoute(SIDEBAR_ROUTES.devices, <Devices />, 'Devices', false),
    iconName: 'server',
  },

  {
    ...createRoute(SIDEBAR_ROUTES.builds, <AdminBuilds />, 'Builds', false),
    iconName: 'package',
  },
  {
    ...createRoute(SIDEBAR_ROUTES.users, <Users />, 'Users', false),
    iconName: 'users',
  },
  {
    ...createRoute(
      SIDEBAR_ROUTES.configuration,
      <Configuration />,
      'Configure',
      false,
    ),
    iconName: 'settings',
  },
  {
    ...createRoute(SIDEBAR_ROUTES.logs, <Logs />, 'Logs', false),
    iconName: 'scroll-text',
  },
  {
    ...createRoute(SIDEBAR_ROUTES.manual, <UserManual />, 'User Manual', false),
    iconName: 'book-open',
  },
];

export const APP_ROUTES: Route[] = [
  {
    path: '/login',
    element: <Login />,
    name: 'Login',
    isNested: false,
  },
];

export const ADMIN_NAVBAR: Route[] = [
  {
    path: '/files',
    element: <></>,
    name: 'File',
    isNested: false,
  },
  {
    path: '/help',
    element: <></>,
    name: 'Help',
    isNested: false,
  },
];

export const USER_SIDEBAR_ROUTES: RouteMap = generateRoutes('user', {
  default: 'dashboard',
  tests: 'tests',
  test: 'tests/',
  devices: 'devices',
  builds: 'builds',
  manual: 'manual',
});

export const USER_APP_SIDEBAR_ROUTES: Route[] = [
  {
    ...createRoute(
      USER_SIDEBAR_ROUTES.default,
      <UserDashboard />,
      'Dashboard',
      false,
    ),
    iconName: 'layout-dashboard',
  },
  {
    ...createRoute(USER_SIDEBAR_ROUTES.tests, <UserTests />, 'Tests', false),
    iconName: 'clipboard-check',
  },
  {
    ...createRoute(
      USER_SIDEBAR_ROUTES.devices,
      <UserDevices />,
      'Devices',
      false,
    ),
    iconName: 'server',
  },
  {
    ...createRoute(USER_SIDEBAR_ROUTES.builds, <UserBuilds />, 'Builds', false),
    iconName: 'package',
  },
  {
    ...createRoute(
      USER_SIDEBAR_ROUTES.manual,
      <UserManual />,
      'User Manual',
      false,
    ),
    iconName: 'book-open',
  },
];

export const USER_ROUTES: Route[] = [
  ...USER_APP_SIDEBAR_ROUTES,
  {
    ...createRoute(
      USER_SIDEBAR_ROUTES.tests + '/:testId',
      <UserTests />,
      'Tests',
      false,
    ),
    iconName: 'clipboard-check',
  },
];
