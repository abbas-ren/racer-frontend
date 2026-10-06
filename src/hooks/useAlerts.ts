import { useEffect, useCallback, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addSingleAlert,
  fetchAlertRequest,
  markAllAsReadRequest,
  readAlertRequest,
} from 'store/slices';
import { RootState, AppDispatch } from 'store/store';
import type { Alerts } from 'store/types/sagaTypes';
import { useAuth } from './useAuth';
import { ROLES } from 'utils/common';
import { useAlertSocket } from './useAlertSocket';
import { AlertData } from 'services/wsClient';

const useAlerts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, data, totalPages } = useSelector(
    (state: RootState) => state.alerts,
  );
  const totalUnreadCount = useSelector(
    (state: RootState) => state.alerts.totalUnreadCount,
  );
  const { user } = useAuth();
  const [readData, setReadData] = useState<Alerts[]>([]);
  const [unreadData, setUnreadData] = useState<Alerts[]>([]);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (user?.realmRoles?.includes(ROLES.Admin)) {
      dispatch(fetchAlertRequest({ page }));
    }
  }, [dispatch, page]);

  const handleReadAlert = useCallback(
    (id: string) => {
      dispatch(readAlertRequest(id));
    },
    [dispatch],
  );

  useAlertSocket((alert: AlertData) => {
    if (alert?.message) {
      dispatch(addSingleAlert(alert.message));
    }
  });

  useEffect(() => {
    if (!Array.isArray(data)) return;

    const toTimestamp = (d: string) => new Date(d).getTime();

    const read = data
      .filter((d) => d.isRead === true)
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));

    const unread = data
      .filter((d) => d.isRead === false)
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));

    setReadData(read);
    setUnreadData(unread);
  }, [dispatch, data]);

  const allData = useMemo(
    () => [...unreadData, ...readData],
    [unreadData, readData],
  );

  const markAllRead = () => {
    dispatch(markAllAsReadRequest());
  };

  return {
    data: allData,
    unreadCount: totalUnreadCount,
    loading,
    error,
    handleReadAlert,
    setPage,
    page,
    totalPages,
    markAllRead,
  };
};

export default useAlerts;
