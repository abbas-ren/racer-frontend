import { useSelector } from 'react-redux';
import type { RootState } from 'store';

// hooks/useAuth.js
export const useAuth = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  return {
    isAuthenticated: !!token,
    token: token,
    user,
  };
};
