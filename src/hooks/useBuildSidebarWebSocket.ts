import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSharedSocket } from 'services/socketIoClient';
import {
  fetchBuildExecutionByTestIdRequest,
  fetchBuildExecutionTestCaseByIdRequest,
  fetchBuildPerformanceByIdRequest,
  fetchBuildExecutionsRequest,
  RootState,
  updateBuildExecutionStatus,
  updateExecutionCancelRequested,
} from 'store/index';
import { isEmpty } from 'utils/common';
import type { Socket } from 'socket.io-client';
import { BuildPerformanceUpdatePayload, BuildTestExecutionUpdatePayload, TestExecutionUpdatePayload } from 'types/websocket';
import { WSPayloadKind } from 'constants/websocket';

interface UseBuildSidebarWebSocketProps {
  buildId: string | null;
}

export const useBuildSidebarWebSocket = ({
  buildId,
}: UseBuildSidebarWebSocketProps) => {
  const PAGE_SIZE = 5;
  const DEBOUNCE_MS = 300;
  const EXECUTION_STATUS_REFRESH_DELAY_MS = 1500;
  const dispatch = useDispatch();
  const executions = useSelector(
    (state: RootState) => state.dashboard.buildExecutions,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<Socket | null>(null);
  const buildIdRef = useRef<string | null>(null);
  const executionIdsRef = useRef<Set<string>>(new Set());
  const testCaseUpdateDebounceRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const executionFetchDebounceRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  useEffect(() => {
    executionIdsRef.current = new Set(
      executions.map((execution) => execution.testId),
    );
  }, [executions]);

  const refetchBuildExecutions = useCallback(
    (targetBuildId: string) => {
      dispatch(
        fetchBuildExecutionsRequest({
          buildId: targetBuildId,
          limit: PAGE_SIZE,
          offset: 0,
          append: false,
        }),
      );
    },
    [dispatch],
  );

  const clearDebounceTimers = useCallback(() => {
    testCaseUpdateDebounceRef.current.forEach((timerId) => {
      clearTimeout(timerId);
    });
    executionFetchDebounceRef.current.forEach((timerId) => {
      clearTimeout(timerId);
    });
    testCaseUpdateDebounceRef.current.clear();
    executionFetchDebounceRef.current.clear();
  }, []);

  const scheduleTestCaseUpdate = useCallback(
    (testId: string, testCaseId: number) => {
      const key = `${testId}:${testCaseId}`;
      const existingTimer = testCaseUpdateDebounceRef.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timeoutId = setTimeout(() => {
        dispatch(
          fetchBuildExecutionTestCaseByIdRequest({ testId, testCaseId }),
        );
        testCaseUpdateDebounceRef.current.delete(key);
      }, DEBOUNCE_MS);

      testCaseUpdateDebounceRef.current.set(key, timeoutId);
    },
    [dispatch],
  );

  const scheduleExecutionFetch = useCallback(
    (targetBuildId: string, testId: string) => {
      const existingTimer = executionFetchDebounceRef.current.get(testId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timeoutId = setTimeout(() => {
        dispatch(
          fetchBuildExecutionByTestIdRequest({
            buildId: targetBuildId,
            testId,
          }),
        );
        executionFetchDebounceRef.current.delete(testId);
      }, DEBOUNCE_MS + EXECUTION_STATUS_REFRESH_DELAY_MS);

      executionFetchDebounceRef.current.set(testId, timeoutId);
    },
    [dispatch],
  );

  const scheduleBuildPerformanceRefresh = useCallback(
    (targetBuildId: string) => {
      const existingTimer = executionFetchDebounceRef.current.get(
        `build:${targetBuildId}`,
      );
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timeoutId = setTimeout(() => {
        dispatch(fetchBuildPerformanceByIdRequest(targetBuildId));
        executionFetchDebounceRef.current.delete(`build:${targetBuildId}`);
      }, DEBOUNCE_MS);

      executionFetchDebounceRef.current.set(
        `build:${targetBuildId}`,
        timeoutId,
      );
    },
    [dispatch],
  );

  const cleanupSocket = useCallback(() => {
    clearDebounceTimers();
    wsRef.current = null;
    buildIdRef.current = null;
  }, [clearDebounceTimers]);

  const disconnect = useCallback(() => {
    cleanupSocket();
    setIsConnected(false);
  }, [cleanupSocket]);

  // Keep refs to latest handler versions so socket listeners never go stale
  const refetchBuildExecutionsRef = useRef(refetchBuildExecutions);
  const scheduleTestCaseUpdateRef = useRef(scheduleTestCaseUpdate);
  const scheduleExecutionFetchRef = useRef(scheduleExecutionFetch);
  const scheduleBuildPerformanceRefreshRef = useRef(
    scheduleBuildPerformanceRefresh,
  );

  useEffect(() => {
    refetchBuildExecutionsRef.current = refetchBuildExecutions;
  }, [refetchBuildExecutions]);
  useEffect(() => {
    scheduleTestCaseUpdateRef.current = scheduleTestCaseUpdate;
  }, [scheduleTestCaseUpdate]);
  useEffect(() => {
    scheduleExecutionFetchRef.current = scheduleExecutionFetch;
  }, [scheduleExecutionFetch]);
  useEffect(() => {
    scheduleBuildPerformanceRefreshRef.current =
      scheduleBuildPerformanceRefresh;
  }, [scheduleBuildPerformanceRefresh]);

  useEffect(() => {
    if (typeof buildId !== 'string' || isEmpty(buildId)) {
      cleanupSocket();
      return;
    }

    const targetBuildId = buildId;

    const ws = getSharedSocket();
    wsRef.current = ws;

    if (buildIdRef.current && buildIdRef.current !== targetBuildId) {
      ws.emit('leave:build', buildIdRef.current);
    }

    buildIdRef.current = targetBuildId;
    ws.emit('join:build', targetBuildId);
    setIsConnected(ws.connected);

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
      ws.emit('join:build', targetBuildId);
    };

    const onConnectError = (err: Error) => {
      setError(new Error('BuildSidebar WebSocket error occurred'));
      console.error('[BuildSidebar WebSocket Error]', err);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onBuildPerformanceUpdate = (payload: BuildPerformanceUpdatePayload) => {
      console.log('Received build performance update:', payload);
      const receivedBuildId = payload?.buildId;
      if (receivedBuildId && receivedBuildId === targetBuildId) {
        refetchBuildExecutionsRef.current(receivedBuildId);
      }
    };

    const onTestExecutionUpdate = (payload: TestExecutionUpdatePayload) => {
      const testId = payload?.testId;
      const status = payload?.status;
      const receivedBuildId = payload?.buildId;

      console.log(
        `Received test_execution_update for testId: ${testId} with status: ${status} and receivedBuildId: ${receivedBuildId}`,
        payload,
      );

      
      if (!receivedBuildId || receivedBuildId !== targetBuildId) {
        return;
      }

      if (!testId) {
        return;
      }

      if (payload.cancelRequested) {
        dispatch(
          updateExecutionCancelRequested({ testId, cancelRequested: true }),
        );
      }

      const hasExecution = executionIdsRef.current.has(testId);

      if (status) {
        dispatch(updateBuildExecutionStatus({ testId, status, progress: payload?.progress ?? null, message: payload?.message ?? null }));
      }

      // Keep single execution API only for missing executions.
      if (!hasExecution) {
        scheduleExecutionFetchRef.current(receivedBuildId, testId);
        scheduleBuildPerformanceRefreshRef.current(receivedBuildId);
      }
    };

    const onBuildTestExecutionUpdate = (payload: BuildTestExecutionUpdatePayload) => {
      const receivedBuildId = payload?.buildId;
      if (!receivedBuildId || receivedBuildId !== targetBuildId) {
        return;
      }

      const testId = payload?.testId;
      if (!testId) {
        return;
      }

      const hasExecution = executionIdsRef.current.has(testId);
      if (hasExecution) {
        const testCaseId = payload?.testCaseId;
        if (typeof testCaseId === 'number') {
          scheduleTestCaseUpdateRef.current(testId, testCaseId);
        }

        // Backend can emit the WS event before testcase persistence is visible
        // through single-case API. A delayed full execution refresh keeps result
        // colors/statuses accurate without forcing immediate list reloads.
        scheduleExecutionFetchRef.current(receivedBuildId, testId);
        scheduleBuildPerformanceRefreshRef.current(receivedBuildId);
        return;
      }

      scheduleExecutionFetchRef.current(receivedBuildId, testId);
      scheduleBuildPerformanceRefreshRef.current(receivedBuildId);
    };

    ws.on(WSPayloadKind.connect, onConnect);
    ws.on(WSPayloadKind.disconnect, onDisconnect);
    ws.on(WSPayloadKind.connectError, onConnectError);
    ws.on(WSPayloadKind.buildPerformanceUpdate, onBuildPerformanceUpdate);
    ws.on(WSPayloadKind.testExecutionUpdate, onTestExecutionUpdate);
    ws.on(WSPayloadKind.buildTestExecutionUpdate, onBuildTestExecutionUpdate);

    return () => {
      ws.emit(WSPayloadKind.leaveBuild, targetBuildId);
      ws.off(WSPayloadKind.connect, onConnect);
      ws.off(WSPayloadKind.disconnect, onDisconnect);
      ws.off(WSPayloadKind.connectError, onConnectError);
      ws.off(WSPayloadKind.buildPerformanceUpdate, onBuildPerformanceUpdate);
      ws.off(WSPayloadKind.testExecutionUpdate, onTestExecutionUpdate);
      ws.off(WSPayloadKind.buildTestExecutionUpdate, onBuildTestExecutionUpdate);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [buildId, cleanupSocket, dispatch]);

  return {
    disconnect,
    isConnected,
    error,
  };
};
