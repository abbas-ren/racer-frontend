import { debounce } from 'radash';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSharedSocket } from 'services/socketIoClient';
import toastService from 'services/ToastService';
import {
  fetchUserDashboardActivityByTestIdRequest,
  fetchUserDashboardBuildPerformanceByIdRequest,
  fetchUserDashboardDataRequest,
  fetchUserDashboardExecutionRequest,
  fetchUserDashboardTestCasesByExecutionIdRequest,
  patchUserDashboardExecutionStatus,
  patchUserDashboardExecutionRtosLogPath,
  fetchInProgressTestsListRequest,
  fetchTestExecutionsRequest,
  getSingleTestExecutionResultRequest,
  getTestExecutionResultRequest,
  refreshUserDashboardDailySummaryRequest,
  removeUserDashboardBuildComparison,
  wsReportStatusUpdate,
} from 'store/slices';
import {
  wsExecutionLogReceived,
  wsExecutionStatusUpdate,
  wsIplProgressUpdate,
  wsResultProgressUpdate,
  clearIplProgress,
  patchExecutionCaseResult,
  batchUpsertExecutionLogs,
  updateExecutionCancelRequested,
} from 'store/slices/testExecution/testExecutionsSlice';
import { appendLiveTestLogs } from 'store/slices/tests/testsSlice';
import { deviceStateUpdate as deviceSliceStateUpdate } from 'store/slices/device/deviceSlice';
import {
  deviceStateUpdate as userDevicesStateUpdate,
  devicePowerUpdate as userDevicesPowerUpdate,
  triggerDevicesRefresh,
} from 'store/slices/userDevices/userDevicesSlice';
import { isEmpty } from 'utils/common';
import type { RootState } from 'store/store';
import type { Socket } from 'socket.io-client';
import {
  BuildTestExecutionUpdatePayload,
  DevicePowerUpdatePayload,
  DeviceStateUpdatePayload,
  TestExecutionPayload,
  TestExecutionType,
  TestExecutionUpdatePayload,
} from 'types/websocket';
import { WSPayloadKind } from 'constants/websocket';
import { TestStatus } from 'types/tests';

export const useUserDashboardWebSocket = (userId: string, isUser: boolean) => {
  const dispatch = useDispatch();
  const buildsComparison = useSelector(
    (state: RootState) => state.userDashboard.buildsComparison,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<Socket | null>(null);
  const dashboardRefreshTimersRef = useRef<Map<string, number>>(new Map());
  const dashboardActivityRefreshTimersRef = useRef<Map<string, number>>(
    new Map(),
  );
  const dashboardBuildRefreshTimersRef = useRef<Map<string, number>>(new Map());
  const testCasesRefreshTimersRef = useRef<Map<string, number>>(new Map());
  const listedBuildIdsRef = useRef<Set<string>>(new Set());

  // Track which executions have test cases loaded (drawer was opened)
  const testCasesByExecutionId = useSelector(
    (state: RootState) => state.userDashboard.testCasesByExecutionId,
  );
  const loadedExecutionIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    loadedExecutionIdsRef.current = new Set(
      Object.keys(testCasesByExecutionId),
    );
  }, [testCasesByExecutionId]);

  // Track testIds that have been cancel-requested so we can filter out non-cancel logs
  const cancelledTestIdsRef = useRef<Set<string>>(new Set());

  // --- Log buffering: accumulate rapid log events and flush as a single batch ---
  const LOG_FLUSH_INTERVAL = 250; // ms
  const logBufferRef = useRef<Map<string, string[]>>(new Map());
  const logFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushLogBuffer = useCallback(() => {
    const buffer = logBufferRef.current;
    if (buffer.size === 0) return;

    const logsBatch: { testId: string; messages: string[] }[] = [];
    const testIdsToRefresh: Set<string> = new Set();

    buffer.forEach((messages, testId) => {
      logsBatch.push({ testId, messages });
      testIdsToRefresh.add(testId);
    });
    buffer.clear();

    // Single batched dispatch for tab + global live log buffers
    dispatch(batchUpsertExecutionLogs(logsBatch));
    // Keep dashboard / tests.logs in sync for the Logs screen
    logsBatch.forEach(({ testId, messages }) => {
      dispatch(appendLiveTestLogs({ testId, messages }));
    });
    // Trigger debounced case refresh for each testId
    testIdsToRefresh.forEach((testId) => {
      dispatch(wsExecutionLogReceived({ testId, message: '' }));
    });
  }, [dispatch]);

  const bufferLog = useCallback(
    (testId: string, message: string) => {
      const buffer = logBufferRef.current;
      let entry = buffer.get(testId);
      if (!entry) {
        entry = [];
        buffer.set(testId, entry);
      }
      entry.push(message);

      if (!logFlushTimerRef.current) {
        logFlushTimerRef.current = setTimeout(() => {
          logFlushTimerRef.current = null;
          flushLogBuffer();
        }, LOG_FLUSH_INTERVAL);
      }
    },
    [flushLogBuffer],
  );

  useEffect(() => {
    listedBuildIdsRef.current = new Set(
      buildsComparison
        .map((build) => build.buildId)
        .filter((buildId): buildId is string => Boolean(buildId)),
    );
  }, [buildsComparison]);

  const debouncedFetchInProgress = useMemo(() => {
    return debounce({ delay: 300 }, () => {
      dispatch(fetchInProgressTestsListRequest());
    });
  }, [dispatch]);

  const scheduleDashboardExecutionRefresh = useCallback(
    (testId: string) => {
      const existingTimer = dashboardRefreshTimersRef.current.get(testId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const nextTimer = window.setTimeout(() => {
        dispatch(fetchUserDashboardExecutionRequest({ testId }));
        dashboardRefreshTimersRef.current.delete(testId);
      }, 500);

      dashboardRefreshTimersRef.current.set(testId, nextTimer);
    },
    [dispatch],
  );

  const scheduleDashboardActivityRefresh = useCallback(
    (testId: string) => {
      const existingTimer =
        dashboardActivityRefreshTimersRef.current.get(testId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const nextTimer = window.setTimeout(() => {
        dispatch(fetchUserDashboardActivityByTestIdRequest({ testId }));
        dashboardActivityRefreshTimersRef.current.delete(testId);
      }, 500);

      dashboardActivityRefreshTimersRef.current.set(testId, nextTimer);
    },
    [dispatch],
  );

  const scheduleDashboardBuildRefresh = useCallback(
    (buildId: string) => {
      const existingTimer = dashboardBuildRefreshTimersRef.current.get(buildId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const nextTimer = window.setTimeout(() => {
        dispatch(fetchUserDashboardBuildPerformanceByIdRequest({ buildId }));
        dashboardBuildRefreshTimersRef.current.delete(buildId);
      }, 300);

      dashboardBuildRefreshTimersRef.current.set(buildId, nextTimer);
    },
    [dispatch],
  );

  // Debounced re-fetch of test cases for an execution (when drawer is open)
  const scheduleTestCasesRefresh = useCallback(
    (testId: string) => {
      // Only refresh if test cases were previously loaded (drawer was opened)
      if (!loadedExecutionIdsRef.current.has(testId)) return;

      const existingTimer = testCasesRefreshTimersRef.current.get(testId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const nextTimer = window.setTimeout(() => {
        dispatch(
          fetchUserDashboardTestCasesByExecutionIdRequest({
            executionId: testId,
            force: true,
            background: true,
          }),
        );
        testCasesRefreshTimersRef.current.delete(testId);
      }, 1000);

      testCasesRefreshTimersRef.current.set(testId, nextTimer);
    },
    [dispatch],
  );

  const debouncedDailySummaryRefresh = useMemo(
    () =>
      debounce({ delay: 1500 }, () => {
        dispatch(refreshUserDashboardDailySummaryRequest());
      }),
    [dispatch],
  );

  const isTerminalExecutionStatus = useCallback((status?: string) => {
    const normalized = (status || '').trim().toUpperCase();

    return (
      normalized === 'COMPLETED' ||
      normalized === 'COMPLETE' ||
      normalized === 'FAILED' ||
      normalized === 'FAIL' ||
      normalized === 'ERROR' ||
      normalized === 'CANCELLED' ||
      normalized === 'CANCELED' ||
      normalized === 'ABORTED' ||
      normalized === 'STOPPED' ||
      normalized === 'FINISHED' ||
      normalized === 'DONE' ||
      normalized === 'SUCCESS' ||
      normalized === 'SUCCEEDED'
    );
  }, []);

  const handleTestExecutionMessage = useCallback(
    (message: TestExecutionPayload) => {
      const isStatusLike =
        message.type === TestExecutionType.New ||
        message.type === TestExecutionType.Status ||
        message.type === TestExecutionType.Queued;
      const shouldRefreshExecution =
        isStatusLike || message.type === TestExecutionType.Log;

      if (message.type === TestExecutionType.New) {
        dispatch(
          fetchTestExecutionsRequest({
            page: '1',
            limit: 20,
            sortBy: 'createdAt',
            desc: 'true',
          }),
        );
        // Also update status for new executions (e.g., QUEUED)
        if (message.data.status) {
          dispatch(
            wsExecutionStatusUpdate({
              testId: message.testId,
              status: message.data.status as TestStatus,
            }),
          );
        }
        // Fetch the single execution to update current view
        dispatch(getSingleTestExecutionResultRequest(message.testId));
      } else if (
        message.type === TestExecutionType.Status ||
        message.type === TestExecutionType.Queued
      ) {
        dispatch(getSingleTestExecutionResultRequest(message.testId));
      }

      // Buffer progress lines: prefer explicit log events; also accept
      // status/new payloads that carry a message (IPL progress, etc.).
      const wsMessage =
        typeof message.data.message === 'string' ? message.data.message : '';
      if (wsMessage) {
        const isCancelledTest = cancelledTestIdsRef.current.has(message.testId);
        const lower = wsMessage.toLowerCase();
        const isCancelLog =
          lower.includes('cancel') ||
          lower.includes('abort') ||
          lower.includes('stopp');
        // After cancel is requested, still accept cancel-related lines and
        // any explicit `log` events (backend may continue emitting progress).
        const shouldBuffer =
          !isCancelledTest ||
          isCancelLog ||
          message.type === TestExecutionType.Log;
        if (shouldBuffer) {
          const timestamp =
            typeof message.data.timestamp === 'string' &&
            message.data.timestamp
              ? message.data.timestamp
              : new Date().toISOString();
          bufferLog(message.testId, `[${timestamp}] ${wsMessage}`);
        }
      }

      if (
        message.type === TestExecutionType.Status ||
        message.type === TestExecutionType.Queued
      ) {
        const nextStatus =
          typeof message.data.status === 'string'
            ? message.data.status
            : message.type === TestExecutionType.Queued
              ? TestStatus.QUEUED
              : '';

        if (nextStatus) {
          dispatch(
            patchUserDashboardExecutionStatus({
              testId: message.testId,
              status: nextStatus as TestStatus,
            }),
          );
          dispatch(
            wsExecutionStatusUpdate({
              testId: message.testId,
              status: nextStatus as TestStatus,
            }),
          );
        }

        if (isTerminalExecutionStatus(nextStatus)) {
          dispatch(
            fetchUserDashboardTestCasesByExecutionIdRequest({
              executionId: message.testId,
              force: true,
              background: true,
            }),
          );
        }

        scheduleDashboardExecutionRefresh(message.testId);
      }

      if (message.type === TestExecutionType.New) {
        scheduleDashboardExecutionRefresh(message.testId);
      }

      if (isStatusLike) {
        scheduleDashboardActivityRefresh(message.testId);
        debouncedDailySummaryRefresh();
      }

      if (message.type === TestExecutionType.CancelRequested) {
        cancelledTestIdsRef.current.add(message.testId);
        dispatch(
          updateExecutionCancelRequested({
            testId: message.testId,
            cancelRequested: true,
          }),
        );
      }

      if (message.type === TestExecutionType.RtosLog && message.data.rtosLogPath) {
        dispatch(
          patchUserDashboardExecutionRtosLogPath({
            testId: message.testId,
            rtosLogPath: message.data.rtosLogPath,
          }),
        );
      }

      // Clean up tracking ref when execution reaches terminal status
      if (message.type === TestExecutionType.Status) {
        const terminalStatuses = [
          TestStatus.CANCELLED,
          TestStatus.FAILED,
          TestStatus.COMPLETED,
        ];
        if (terminalStatuses.includes(message.data.status as TestStatus)) {
          cancelledTestIdsRef.current.delete(message.testId);
        }
      }

      if (message.type === TestExecutionType.Log) {
        scheduleDashboardExecutionRefresh(message.testId);
        // Re-fetch test cases if drawer is open for this execution
        scheduleTestCasesRefresh(message.testId);
      }

      if (message.testId && shouldRefreshExecution) {
        dispatch(getTestExecutionResultRequest(message.testId));
      }
      if (shouldRefreshExecution) {
        debouncedFetchInProgress();
      }
    },
    [
      bufferLog,
      debouncedFetchInProgress,
      debouncedDailySummaryRefresh,
      dispatch,
      scheduleDashboardActivityRefresh,
      scheduleDashboardExecutionRefresh,
      scheduleTestCasesRefresh,
      isTerminalExecutionStatus,
    ],
  );

  const userDevicesData = useSelector(
    (state: RootState) => state.userDevices.data,
  );
  const totalDevices = useSelector(
    (state: RootState) => state.userDevices.totalDevices,
  );

  // Track ALL known device IDs across pages (not just current page)
  // so we only trigger a full refresh for genuinely new devices
  const knownDeviceIdsRef = useRef<Set<string>>(new Set());
  const lastTotalDevicesRef = useRef(totalDevices);

  useEffect(() => {
    userDevicesData.forEach((d) => knownDeviceIdsRef.current.add(d.deviceId));
  }, [userDevicesData]);

  useEffect(() => {
    lastTotalDevicesRef.current = totalDevices;
  }, [totalDevices]);

  const handleDeviceStateUpdate = useCallback(
    (message: DeviceStateUpdatePayload) => {
      // Update both device slice and userDevices slice (in-place row update)
      dispatch(deviceSliceStateUpdate(message));
      dispatch(userDevicesStateUpdate(message));

      // Only trigger a full re-fetch for genuinely new devices
      // (never seen on any page), not for off-page devices we already know about
      if (!knownDeviceIdsRef.current.has(message.deviceId)) {
        knownDeviceIdsRef.current.add(message.deviceId);
        dispatch(triggerDevicesRefresh());
      }
    },
    [dispatch],
  );

  const handleDevicePowerUpdate = useCallback(
    (message: DevicePowerUpdatePayload) => {
      // Update userDevices slice with power state
      dispatch(userDevicesPowerUpdate(message));
    },
    [dispatch],
  );

  const clearMessage = useCallback(() => {}, []);

  // Keep refs to latest handler versions so socket listeners never go stale
  const handleTestExecutionMessageRef = useRef(handleTestExecutionMessage);
  const handleDeviceStateUpdateRef = useRef(handleDeviceStateUpdate);
  const handleDevicePowerUpdateRef = useRef(handleDevicePowerUpdate);
  const scheduleDashboardBuildRefreshRef = useRef(
    scheduleDashboardBuildRefresh,
  );
  const bufferLogRef = useRef(bufferLog);

  useEffect(() => {
    handleTestExecutionMessageRef.current = handleTestExecutionMessage;
  }, [handleTestExecutionMessage]);
  useEffect(() => {
    handleDeviceStateUpdateRef.current = handleDeviceStateUpdate;
  }, [handleDeviceStateUpdate]);
  useEffect(() => {
    handleDevicePowerUpdateRef.current = handleDevicePowerUpdate;
  }, [handleDevicePowerUpdate]);
  useEffect(() => {
    scheduleDashboardBuildRefreshRef.current = scheduleDashboardBuildRefresh;
  }, [scheduleDashboardBuildRefresh]);
  useEffect(() => {
    bufferLogRef.current = bufferLog;
  }, [bufferLog]);

  useEffect(() => {
    if (isEmpty(userId)) {
      wsRef.current = null;
      setIsConnected(false);
      return;
    }

    const ws = getSharedSocket(userId);
    wsRef.current = ws;
    setIsConnected(ws.connected);

    if (isUser) {
      ws.emit('join:dashboard', 'user');
    }

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
      if (isUser) {
        ws.emit('join:dashboard', 'user');
        dispatch(fetchUserDashboardDataRequest());
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = () => {
      setError(new Error('WebSocket error occurred'));
    };

    const onTestExecution = (data: TestExecutionPayload) => {
      handleTestExecutionMessageRef.current(data);
    };

    const onDeviceState = (data: DeviceStateUpdatePayload) => {
      handleDeviceStateUpdateRef.current(data);
    };

    const onDevicePower = (data: DevicePowerUpdatePayload) => {
      handleDevicePowerUpdateRef.current(data);
    };

    const onExecutionReportUpdate = (data: {
      testExecutionId?: string;
      status?: string;
      error?: string;
      uploadError?: string;
    }) => {
      const { testExecutionId, status, error, uploadError } = data;
      if (!testExecutionId || !status) {
        return;
      }

      const frontendStatus: import('store/slices/userDashboard/userDashboardSlice').ExecutionReportStatus =
        status === 'completed'
          ? 'completed'
          : status === 'failed'
            ? 'failed'
            : status === 'uploading'
              ? 'uploading'
              : status === 'uploaded'
                ? 'uploaded'
                : 'generating';

      dispatch(
        wsReportStatusUpdate({
          testExecutionId,
          status: frontendStatus,
          error: error ?? null,
          uploadError: uploadError ?? null,
        }),
      );

      if (frontendStatus === 'failed') {
        toastService.error(error ?? 'Report generation failed.');
      }

      if (frontendStatus === 'uploaded') {
        toastService.success('Report uploaded to Confluence successfully.');
      }

      if (uploadError) {
        toastService.error(uploadError);
      }
    };

    const onBuildPerformanceUpdate = (payload: { buildId?: string }) => {
      if (typeof payload?.buildId === 'string' && payload.buildId) {
        if (listedBuildIdsRef.current.has(payload.buildId)) {
          scheduleDashboardBuildRefreshRef.current(payload.buildId);
        }
      }
    };

    const onBuildDeleted = (data: { releaseId?: string }) => {
      if (typeof data?.releaseId === 'string' && data.releaseId) {
        dispatch(removeUserDashboardBuildComparison(data.releaseId));
        dispatch(fetchUserDashboardDataRequest());
      }
    };

    // IPL / result progress + log text on testExecutionUpdate.
    const onTestExecutionUpdate = (payload: TestExecutionUpdatePayload) => {
      const testId = payload?.testId;
      if (!testId) {
        return;
      }
      const message =
        typeof payload?.message === 'string' ? payload.message.trim() : '';
      const lower = message.toLowerCase();
      const isIplUpdate =
        lower.includes('ipl') ||
        lower.includes('flash') ||
        lower.includes('flashing');
      const isResultUpdate =
        lower.includes('result progress') ||
        lower.includes('selected tests are starting') ||
        lower.includes('test cases complete');

      if (typeof payload.progress === 'number') {
        if (isIplUpdate) {
          dispatch(
            wsIplProgressUpdate({
              testId,
              progress: payload.progress,
            }),
          );
        } else if (isResultUpdate || !isIplUpdate) {
          dispatch(
            wsResultProgressUpdate({
              testId,
              progress: payload.progress,
            }),
          );
          if (payload.progress === 0 || isResultUpdate) {
            dispatch(clearIplProgress({ testId }));
          }
        }
      }

      // Never treat IPL 100% as execution completed — backend keeps inProgress.
      if (payload.status && !(isIplUpdate && payload.status === TestStatus.COMPLETED)) {
        dispatch(
          wsExecutionStatusUpdate({
            testId,
            status: payload.status as TestStatus,
          }),
        );
      }
      if (message) {
        bufferLogRef.current(testId, `[${new Date().toISOString()}] ${message}`);
      }
      scheduleTestCasesRefresh(testId);
      debouncedFetchInProgress();
    };

    const onBuildTestExecutionUpdate = (
      payload: BuildTestExecutionUpdatePayload,
    ) => {
      const testId = payload?.testId;
      if (!testId) {
        return;
      }
      if (payload.testCaseId && payload.status) {
        dispatch(
          patchExecutionCaseResult({
            testId,
            testCaseId: payload.testCaseId,
            result: payload.status,
          }),
        );
      }
      dispatch(clearIplProgress({ testId }));
      scheduleTestCasesRefresh(testId);
      dispatch(getTestExecutionResultRequest(testId));
      debouncedFetchInProgress();
    };

    ws.on(WSPayloadKind.connect, onConnect);
    ws.on(WSPayloadKind.disconnect, onDisconnect);
    ws.on(WSPayloadKind.connectError, onConnectError);
    ws.on(WSPayloadKind.testExecution, onTestExecution);
    ws.on(WSPayloadKind.testExecutionUpdate, onTestExecutionUpdate);
    ws.on(WSPayloadKind.buildTestExecutionUpdate, onBuildTestExecutionUpdate);
    ws.on(WSPayloadKind.deviceStateUpdate, onDeviceState);
    ws.on(WSPayloadKind.devicePowerUpdate, onDevicePower);
    ws.on(WSPayloadKind.executionReportUpdate, onExecutionReportUpdate);
    ws.on(WSPayloadKind.buildPerformanceUpdate, onBuildPerformanceUpdate);
    ws.on(WSPayloadKind.buildDeleted, onBuildDeleted);

    return () => {
      if (isUser) {
        ws.emit('leave:dashboard', 'user');
      }
      ws.off(WSPayloadKind.connect, onConnect);
      ws.off(WSPayloadKind.disconnect, onDisconnect);
      ws.off(WSPayloadKind.connectError, onConnectError);
      ws.off(WSPayloadKind.testExecution, onTestExecution);
      ws.off(WSPayloadKind.testExecutionUpdate, onTestExecutionUpdate);
      ws.off(WSPayloadKind.buildTestExecutionUpdate, onBuildTestExecutionUpdate);
      ws.off(WSPayloadKind.deviceStateUpdate, onDeviceState);
      ws.off(WSPayloadKind.devicePowerUpdate, onDevicePower);
      ws.off(WSPayloadKind.executionReportUpdate, onExecutionReportUpdate);
      ws.off(WSPayloadKind.buildPerformanceUpdate, onBuildPerformanceUpdate);
      ws.off(WSPayloadKind.buildDeleted, onBuildDeleted);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [userId, isUser, dispatch]);

  useEffect(() => {
    const dashboardRefreshTimers = dashboardRefreshTimersRef.current;
    const dashboardActivityRefreshTimers =
      dashboardActivityRefreshTimersRef.current;
    const dashboardBuildRefreshTimers = dashboardBuildRefreshTimersRef.current;
    const testCasesRefreshTimers = testCasesRefreshTimersRef.current;

    return () => {
      dashboardRefreshTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      dashboardRefreshTimers.clear();

      dashboardActivityRefreshTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      dashboardActivityRefreshTimers.clear();

      dashboardBuildRefreshTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      dashboardBuildRefreshTimers.clear();

      testCasesRefreshTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      testCasesRefreshTimers.clear();

      // Flush any remaining buffered logs on unmount
      if (logFlushTimerRef.current) {
        clearTimeout(logFlushTimerRef.current);
        logFlushTimerRef.current = null;
      }
      flushLogBuffer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    error,
    clearMessage,
  };
};
