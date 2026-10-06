import { useAuth } from 'hooks/useAuth';
import { useLocation, Navigate } from 'react-router';
import { SIDEBAR_ROUTES, USER_SIDEBAR_ROUTES } from 'constants/routes';
import { ROLES } from 'utils/common';
import { JSX } from 'react';

type ProtectedRouteProps = {
  element: JSX.Element;
  allowedRoles?: string[];
};

const ProtectedRoute = ({ element, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const hasAllowedRole =
    !allowedRoles ||
    allowedRoles.some((role) => user?.realmRoles?.includes(role));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAllowedRole) {
    if (user?.realmRoles?.includes(ROLES.Admin)) {
      return <Navigate to={`/${SIDEBAR_ROUTES.default}`} replace />;
    }

    if (user?.realmRoles?.includes(ROLES.User)) {
      return <Navigate to={`/${USER_SIDEBAR_ROUTES.default}`} replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return element;
};

export default ProtectedRoute;
