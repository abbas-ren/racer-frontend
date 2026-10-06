import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  actionUserRequest,
  deleteUserRequest,
  fetchUsersRequest,
  clearUsersMessage,
  addUserRequest,
} from 'store/slices';
import { RootState } from 'store/store';
import { ROLES, UserRequestAction } from 'utils/common';
import { useAuth } from './useAuth';
// import { useLoading } from 'context/LoadingContext';
import { USER_ACTION_LOADING } from 'constants/messagesConstants';
import { Id } from 'react-toastify';
import toastService from 'services/ToastService';
import { useUsersSocket } from './useUsersSocket';
import { UserData } from 'services/wsClient';

const useUsers = () => {
  const dispatch = useDispatch();
  const {
    loading,
    error,
    users,
    requests,
    currentPage,
    totalDevices,
    totalPages,
    message,
    actionLoading,
    dataFetched,
  } = useSelector((state: RootState) => state.users);

  const { user } = useAuth();
  // const { setError, setLoading } = useLoading();

  const loadingToastIdRef = useRef<Id | null>(null);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.realmRoles?.includes(ROLES.Admin) && !dataFetched) {
      dispatch(fetchUsersRequest({}));
    }
  }, [user, dataFetched, dispatch]);

  // useEffect(() => {
  //   setLoading(loading);
  //   setError(error || '');
  // }, [loading, error, setLoading, setError]);

  useEffect(() => {
    if (message && message !== lastMessageRef.current) {
      if (loadingToastIdRef.current) {
        toastService.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }
      const timeout = setTimeout(() => {
        toastService.success(message);
        lastMessageRef.current = message;
        dispatch(clearUsersMessage());
      }, 160);

      return () => clearTimeout(timeout);
    }
  }, [message, dispatch]);

  useEffect(() => {
    if (error && error !== lastMessageRef.current) {
      if (loadingToastIdRef.current) {
        toastService.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }
      const timeout = setTimeout(() => {
        toastService.error(error);
        lastMessageRef.current = error;
        dispatch(clearUsersMessage());
      }, 160);

      return () => clearTimeout(timeout);
    }
  }, [error, dispatch]);

  const handleUserRequest = useCallback(
    (userId: string, action: UserRequestAction) => {
      loadingToastIdRef.current = toastService.loading(USER_ACTION_LOADING);
      dispatch(actionUserRequest({ userId, action }));
    },
    [dispatch],
  );

  const handleRemoveUser = useCallback(
    (userId: string) => {
      dispatch(deleteUserRequest({ userId }));
    },
    [dispatch],
  );

  useUsersSocket((user: UserData) => {
    if (user?.message) {
      dispatch(addUserRequest(user.message));
    }
  });

  const data = useMemo(() => {
    const sortedRequests =
      requests
        ?.slice()
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp) || [];
    const sortedUsers =
      users?.slice().sort((a, b) => b.createdTimestamp - a.createdTimestamp) ||
      [];
    return [...sortedRequests, ...sortedUsers];
  }, [requests, users]);

  return {
    data,
    requests,
    users,
    currentPage,
    totalDevices,
    totalPages,
    handleUserRequest,
    handleRemoveUser,
    loading,
    actionLoading,
  };
};

export default useUsers;
