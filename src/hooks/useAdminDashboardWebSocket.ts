import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSharedSocket } from 'services/socketIoClient';
import {
  fetchBuildPerformanceByIdRequest,
  fetchBuildsPerformanceRequest,
  removeBuildPerformance,
} from 'store/slices';
import { RootState } from 'store/store';
import type { Socket } from 'socket.io-client';
import { WSPayloadKind } from 'constants/websocket';
import { BuildDeletedPayload, BuildPerformanceUpdatePayload } from 'types/websocket';

export const useAdminDashboardWebSocket = (dashboard = 'admin') => {
  const DEBOUNCE_MS = 300;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<Socket | null>(null);
  const dashboardRef = useRef<string | null>(null);
  const buildIdsRef = useRef<Set<string>>(new Set());
  const refreshDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const dispatch = useDispatch();
  const buildsPerformance = useSelector(
    (state: RootState) => state.dashboard.buildsPerformance,
  );

  useEffect(() => {
    buildIdsRef.current = new Set(
      buildsPerformance.map((build) => build.buildId),
    );
  }, [buildsPerformance]);

  const clearDebounceTimers = () => {
    refreshDebounceRef.current.forEach((timerId) => {
      clearTimeout(timerId);
    });
    refreshDebounceRef.current.clear();
  };

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const ws = getSharedSocket();
    wsRef.current = ws;

    if (dashboardRef.current && dashboardRef.current !== dashboard) {
      ws.emit('leave:dashboard', dashboardRef.current);
    }

    ws.emit('join:dashboard', dashboard);
    dashboardRef.current = dashboard;
    setIsConnected(ws.connected);

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
      ws.emit('join:dashboard', dashboard);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = () => {
      setError(new Error('AdminDashboard WebSocket error occurred'));
    };

    const onBuildPerformanceUpdate = (data: BuildPerformanceUpdatePayload) => {
      console.log('Received build performance update:', data);
      const targetBuildId = data?.buildId;
      if (typeof targetBuildId === 'string' && targetBuildId) {
        const buildExists = buildIdsRef.current.has(targetBuildId);
        if (buildExists) {
          const existingTimer = refreshDebounceRef.current.get(targetBuildId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          const timeoutId = setTimeout(() => {
            dispatch(fetchBuildPerformanceByIdRequest(targetBuildId));
            refreshDebounceRef.current.delete(targetBuildId);
          }, DEBOUNCE_MS);

          refreshDebounceRef.current.set(targetBuildId, timeoutId);
        }
      }
    };

    const onBuildDeleted = (data: BuildDeletedPayload) => {
      console.log('Received build deleted update:', data);
      if (typeof data?.releaseId === 'string' && data.releaseId) {
        dispatch(removeBuildPerformance(data.releaseId));
        dispatch(fetchBuildsPerformanceRequest());
      }
    };

    ws.on(WSPayloadKind.connect, onConnect);
    ws.on(WSPayloadKind.disconnect, onDisconnect);
    ws.on(WSPayloadKind.connectError, onConnectError);
    ws.on(WSPayloadKind.buildPerformanceUpdate, onBuildPerformanceUpdate);
    ws.on(WSPayloadKind.buildDeleted, onBuildDeleted);

    return () => {
      clearDebounceTimers();
      ws.emit('leave:dashboard', dashboard);
      ws.off(WSPayloadKind.connect, onConnect);
      ws.off(WSPayloadKind.disconnect, onDisconnect);
      ws.off(WSPayloadKind.connectError, onConnectError);
      ws.off(WSPayloadKind.buildPerformanceUpdate, onBuildPerformanceUpdate);
      ws.off(WSPayloadKind.buildDeleted, onBuildDeleted);
    };
  }, [dashboard, dispatch]);

  return {
    isConnected,
    error,
  };
};
