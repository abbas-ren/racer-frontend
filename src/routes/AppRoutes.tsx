import { Route, Routes, Navigate } from 'react-router';
import { useAuth } from 'hooks/useAuth';
import {
  APP_ROUTES,
  APP_SIDEBAR_ROUTES,
  SIDEBAR_ROUTES,
  USER_ROUTES,
  USER_SIDEBAR_ROUTES,
} from 'constants/routes';
import ProtectedRoute from '../auth/ProtectedRoute';
import Container from 'components/Container/Container';
import { ROLES } from 'utils/common';
import UserContainer from 'components/Container/UserContainer';
import { WebCLIProvider } from 'components/Terminal/WebCLIProvider';

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRoute = () => {
    if (isAuthenticated) {
      if (user?.realmRoles?.includes(ROLES.Admin)) {
        return SIDEBAR_ROUTES.default;
      } else if (user?.realmRoles?.includes(ROLES.User)) {
        return USER_SIDEBAR_ROUTES.default;
      }
    }
    return '/login';
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      {APP_ROUTES.map(({ path, element, name }) => (
        <Route key={name} path={path} element={element} />
      ))}
      <Route
        path="/"
        element={
          // <WebCLIProvider>
          <Container />
          // </WebCLIProvider>
        }
      >
        {APP_SIDEBAR_ROUTES.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute element={element} allowedRoles={[ROLES.Admin]} />
            }
          />
        ))}
      </Route>

      <Route
        path="/"
        element={
          <WebCLIProvider>
            <UserContainer />
          </WebCLIProvider>
        }
      >
        {USER_ROUTES.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute element={element} allowedRoles={[ROLES.User]} />
            }
          />
        ))}
      </Route>
    </Routes>
  );
};

export default AppRoutes;
