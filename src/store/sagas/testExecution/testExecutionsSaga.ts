import {
  all,
  call,
  put,
  select,
  takeLatest,
  takeEvery,
  debounce,
} from 'redux-saga/effects';
import {
  createTabRequest,
  createTabSuccess,
  createTabFailure,
  deleteTabRequest,
  deleteTabSuccess,
  deleteTabFailure,
  fetchDeviceFamiliesRequest,
  fetchDeviceFamiliesSuccess,
  fetchDeviceFamiliesFailure,
  fetchDeviceTypesRequest,
  fetchDeviceTypesSuccess,
  fetchDeviceTypesFailure,
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
  fetchBuildsForDeviceTypeRequest,
  fetchTabTestPlansRequest,
  fetchTabTestPlansSuccess,
  fetchTabTestPlansFailure,
  fetchTabTestSuitesRequest,
  fetchTabTestSuitesSuccess,
  fetchTabTestSuitesFailure,
  fetchTestCasesRequest,
  fetchTestCasesSuccess,
  fetchTestCasesFailure,
  submitNewTestExecutionRequest,
  submitNewTestExecutionFinished,
  setActiveTab,
  setTabExecution,
  upsertExecutionLog,
  setExecutionCases,
  clearTabExecution,
  refreshExecutionCasesRequest,
  wsExecutionLogReceived,
  downloadLogsFailure,
  downloadLogsSuccess,
  downloadLogsRequest,
  wsExecutionStatusUpdate,
  updateExecutionStatus,
  updateExecutionCancelRequested,
  loadTestExecutionRequest,
  loadTestExecutionSuccess,
  loadTestExecutionFailure,
  setTabFiltersFromExecution,
  updateTabName,
  restoreSelectionFromInput,
} from 'store/slices/testExecution/testExecutionsSlice';
import {
  fetchDeviceFamilies as apiFetchDeviceFamilies,
  fetchDeviceTypes as apiFetchDeviceTypes,
  fetchBuildsForDeviceType as apiFetchBuildsForDeviceType,
} from 'services/deviceApiService';
import toastService from 'services/ToastService';
import {
  fetchTestPlanList,
  fetchTestSuitesList,
  fetchTestCasesList,
  testExecutionDirect,
  getTestCasesByExecutionId,
  downloadTestLog,
  getTestExecution,
  getTestExecutionForTable,
} from 'services/testsApiService';
import { RootState } from 'store/store';
import type { TestCase, TestExecutionForTable } from 'types/tests';
import { TestStatus } from 'types/tests';
import type { TestsQuery, TestPlan, TestSuite } from 'typesCustom/tests';
import type { TestCaseEntryForLogs } from 'types/tests';
import type { ReleaseAttributes } from 'typesCustom/tests';

// Utility to generate unique tab IDs
const generateTabId = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const selectTestExecutions = (state: RootState) => state.testExecutions;

const terminalStatusToastMessage: Partial<Record<TestStatus, string>> = {
  [TestStatus.COMPLETED]: 'Test Execution Completed ID:',
  [TestStatus.CANCELLED]: 'Test Execution Cancelled ID:',
  [TestStatus.FAILED]: 'Test Execution Failed ID:',
};

const terminalStatusToastVariant: Partial<
  Record<TestStatus, 'success' | 'error'>
> = {
  [TestStatus.COMPLETED]: 'success',
  [TestStatus.CANCELLED]: 'error',
  [TestStatus.FAILED]: 'error',
};

// Tracks last-notified status per testId to suppress duplicate WS toast events
const notifiedStatusMap = new Map<string, string>();

// ===== Tab Lifecycle Sagas =====

function* handleCreateTab() {
  try {
    const newTabId = generateTabId();

    yield put(createTabSuccess({ tabId: newTabId }));
    // Preload device families for new tab
    yield put(fetchDeviceFamiliesRequest({ tabId: newTabId }));
  } catch (error) {
    yield put(
      createTabFailure(
        error instanceof Error ? error.message : 'Failed to create tab',
      ),
    );
  }
}

function* handleDeleteTab(action: ReturnType<typeof deleteTabRequest>) {
  const { tabId } = action.payload;

  try {
    yield put(deleteTabSuccess({ tabId }));
  } catch (error) {
    yield put(
      deleteTabFailure({
        tabId,
        error: error instanceof Error ? error.message : 'Failed to delete tab',
      }),
    );
  }
}

// ===== Resource Fetch Sagas =====

function* handleFetchDeviceFamilies(
  action: ReturnType<typeof fetchDeviceFamiliesRequest>,
): Generator<unknown, void, string[]> {
  const { tabId } = action.payload;

  try {
    const items: string[] = yield call(apiFetchDeviceFamilies);
    yield put(fetchDeviceFamiliesSuccess({ tabId, items }));
  } catch {
    yield put(
      fetchDeviceFamiliesFailure({
        tabId,
        error: 'Failed to fetch device families',
      }),
    );
  }
}

function* handleFetchDeviceTypes(
  action: ReturnType<typeof fetchDeviceTypesRequest>,
): Generator<unknown, void, string[]> {
  const { tabId, deviceFamily } = action.payload;

  try {
    console.log(
      '[handleFetchDeviceTypes] Fetching for:',
      deviceFamily,
      'tabId:',
      tabId,
    );
    const items: string[] = yield call(apiFetchDeviceTypes, deviceFamily);
    console.log('[handleFetchDeviceTypes] Success:', items);
    yield put(fetchDeviceTypesSuccess({ tabId, items }));
  } catch {
    yield put(
      fetchDeviceTypesFailure({ tabId, error: 'Failed to fetch device types' }),
    );
  }
}

function* handleFetchBuilds(
  action: ReturnType<typeof fetchBuildsRequest>,
): Generator<unknown, void, ReleaseAttributes[]> {
  const { tabId, deviceType } = action.payload;

  try {
    console.log(
      '[handleFetchBuilds] Fetching for device type:',
      deviceType,
      'tabId:',
      tabId,
    );
    const items: ReleaseAttributes[] = yield call(
      apiFetchBuildsForDeviceType,
      deviceType,
    );
    console.log('[handleFetchBuilds] Success:', items.length, 'builds');
    yield put(fetchBuildsSuccess({ tabId, deviceType, items }));
  } catch {
    yield put(fetchBuildsFailure({ tabId, error: 'Failed to fetch builds' }));
  }
}

function* handleFetchTestPlans(
  action: ReturnType<typeof fetchTabTestPlansRequest>,
): Generator<unknown, void, TestPlan[]> {
  const { tabId } = action.payload;

  try {
    const query: TestsQuery = {} as TestsQuery;
    const items = (yield call(fetchTestPlanList, query)) as TestPlan[];
    yield put(fetchTabTestPlansSuccess({ tabId, items }));
  } catch {
    yield put(
      fetchTabTestPlansFailure({ tabId, error: 'Failed to fetch test plans' }),
    );
  }
}

function* handleFetchTestSuites(
  action: ReturnType<typeof fetchTabTestSuitesRequest>,
): Generator<unknown, void, TestSuite[]> {
  const { tabId, planId } = action.payload;

  try {
    const items = (yield call(fetchTestSuitesList, {
      planId,
    })) as TestSuite[];
    yield put(fetchTabTestSuitesSuccess({ tabId, items }));
  } catch (error) {
    yield put(
      fetchTabTestSuitesFailure({
        tabId,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch test suites',
      }),
    );
  }
}

function* handleFetchTestCases(
  action: ReturnType<typeof fetchTestCasesRequest>,
): Generator<unknown, void, TestCase[]> {
  const { tabId, planId, suiteId } = action.payload;

  try {
    console.log('Fetching test cases for suite ID:', suiteId);
    const items = (yield call(fetchTestCasesList, {
      planId,
      suiteId: Number(suiteId),
    })) as TestCase[];
    console.log('Fetched', items?.length || 0, 'test cases for suite', suiteId);
    yield put(fetchTestCasesSuccess({ tabId, suiteId, items }));
  } catch (error) {
    console.error('Failed to fetch test cases for suite', suiteId, ':', error);
    yield put(
      fetchTestCasesFailure({
        tabId,
        suiteId,
        error:
          error instanceof Error ? error.message : 'Failed to fetch test cases',
      }),
    );
  }
}

// ===== Test Execution =====

function* handleSubmitTestExecution(
  action: ReturnType<typeof submitNewTestExecutionRequest>,
): Generator<unknown, void, unknown> {
  const { tabId } = action.payload;

  try {
    const state = (yield select(selectTestExecutions)) as ReturnType<
      typeof selectTestExecutions
    >;
    const tab = state.tabsById[tabId];

    if (!tab) {
      toastService.error('Tab not found');
      return;
    }

    const currentExecution = tab.values.data.testExecution;

    // Check if there's an active execution that hasn't completed
    if (currentExecution) {
      const { status } = currentExecution;
      if (status === TestStatus.IN_PROGRESS || status === TestStatus.QUEUED) {
        toastService.error(
          'Test execution already in progress. Please wait for it to complete.',
        );
        return;
      }

      // If execution is completed, failed, or cancelled, we can start a new one
      // Clear previous execution data
      if (
        status === TestStatus.COMPLETED ||
        status === TestStatus.FAILED ||
        status === TestStatus.CANCELLED
      ) {
        yield put(clearTabExecution({ tabId }));
      }
    }

    const filters = tab.values.filters;
    const rules = tab.values.data.testPlanSelectionRules;
    const testPlans = tab.values.data.testPlans.items;

    // Validate required fields
    if (
      !filters.deviceFamily ||
      !filters.deviceType ||
      !filters.buildID ||
      !filters.testPlan
    ) {
      toastService.error(
        'Please select device family, device type, build, and test plan',
      );
      return;
    }

    // Find test plan name
    const planId = filters.testPlan;
    const testPlan = testPlans.find((p) => String(p.id) === planId);
    const planName = testPlan?.name || '';

    const selection: {
      mode: 'ALL' | 'PARTIAL';
      planId: string;
      planName: string;
      exclude?: {
        suites: string[];
        casesBySuite: Record<string, string[]>;
      };
      suites?: Array<{
        suiteId: string;
        selectAll: boolean;
        cases?: string[];
      }>;
    } = {
      mode: rules.mode,
      planId: planId,
      planName: planName,
    };

    if (rules.mode === 'ALL') {
      selection.exclude = {
        suites: rules.exclude.suites.map(String),
        casesBySuite: Object.fromEntries(
          Object.entries(rules.exclude.cases).map(([k, v]) => [
            String(k),
            v.map(String),
          ]),
        ),
      };
    } else {
      // PARTIAL mode: build suites array according to backend PartialSuiteSelection schema
      const suites = [];

      // Add suites that are fully selected
      for (const suiteId of rules.include.suites) {
        suites.push({
          suiteId: String(suiteId),
          selectAll: true,
        });
      }

      // Add suites with specific cases selected
      for (const [suiteId, caseIds] of Object.entries(rules.include.cases)) {
        if (caseIds && caseIds.length > 0) {
          // Check if this suite is already added as selectAll
          const existingIndex = suites.findIndex(
            (s) => s.suiteId === String(suiteId),
          );
          if (existingIndex >= 0) {
            // Suite is selectAll, but has specific cases - this shouldn't happen
            // Keep as selectAll
            continue;
          }
          suites.push({
            suiteId: String(suiteId),
            selectAll: false,
            cases: caseIds.map(String),
          });
        }
      }

      selection.suites = suites;
    }

    const executionPayload = {
      deviceFamily: filters.deviceFamily,
      deviceType: filters.deviceType,
      buildId: filters.buildID,
      selection,
    };

    console.log('Submitting test execution:', executionPayload);

    const response = (yield call(
      testExecutionDirect,
      executionPayload,
    )) as Awaited<ReturnType<typeof testExecutionDirect>>;

    const testId = response.testId || response.testExecutionId;
    if (testId) {
      // Use the status from API response (QUEUED initially)
      const status =
        (response as { status?: TestStatus }).status || TestStatus.QUEUED;

      toastService.info('Test Execution is added to queue');

      const execution = {
        testId,
        status,
        logs: [],
        testCases: [],
      };

      yield put(setTabExecution({ tabId, execution }));

      // Recover from race where early WS updates can arrive before tab binds to testId.
      try {
        const latestExecution = (yield call(
          getTestExecution,
          testId,
        )) as Awaited<ReturnType<typeof getTestExecution>>;
        if (latestExecution) {
          yield put(
            setTabExecution({
              tabId,
              execution: {
                testId,
                status: (latestExecution.status as TestStatus) ?? status,
                logs: Array.isArray(latestExecution.logs)
                  ? latestExecution.logs
                  : [],
                testCases: [],
              },
            }),
          );
        }
      } catch (syncError) {
        console.warn('Initial execution sync failed:', syncError);
      }
    }
  } catch (error) {
    console.error('Failed to submit test execution:', error);

    // Extract meaningful error message from API response
    let errorMessage = 'Failed to start test execution';

    if (error && typeof error === 'object') {
      // Check for axios error with response data
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      if (axiosError.response?.data?.message) {
        // Extract the actual error message from backend
        const backendMessage = axiosError.response.data.message;

        // Check if it's a faulty build error
        if (
          backendMessage.includes('marked as faulty') ||
          backendMessage.includes('is faulty')
        ) {
          errorMessage =
            'Cannot run tests: This build is marked as faulty. Please select a different build or contact admin this build if it was marked in error.';
        } else if (
          backendMessage.includes('Failed to create test execution:')
        ) {
          // Remove the "Failed to create test execution:" prefix for cleaner message
          errorMessage = backendMessage
            .replace('Failed to create test execution: Error: ', '')
            .replace('Failed to create test execution: ', '');
        } else {
          errorMessage = backendMessage;
        }
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    toastService.error(errorMessage, { autoClose: 8000 });
  } finally {
    yield put(submitNewTestExecutionFinished({ tabId }));
  }
}

function* handleActiveTabChanged(action: ReturnType<typeof setActiveTab>) {
  try {
    const tabId = action.payload;
    const state = (yield select(selectTestExecutions)) as ReturnType<
      typeof selectTestExecutions
    >;
    const tab = state.tabsById[tabId];

    if (
      tab &&
      tab.values.data.deviceFamilies.items.length === 0 &&
      !tab.values.data.deviceFamilies.loading
    ) {
      yield put(fetchDeviceFamiliesRequest({ tabId }));
    }
  } catch (error) {
    console.warn('Failed to initialize tab', action.payload, error);
  }
}

function* handleWsLogUpsert(
  action: ReturnType<typeof wsExecutionLogReceived>,
): Generator<unknown, void, unknown> {
  const { testId, message } = action.payload;
  // When message is non-empty (single log), upsert directly; when empty it's a
  // batched flush trigger — the batch reducer already wrote the logs.
  if (message) {
    yield put(upsertExecutionLog({ testId, message }));
  }
  yield put(refreshExecutionCasesRequest({ testId }));
}

function* handleWsExecutionStatusUpdate(
  action: ReturnType<typeof wsExecutionStatusUpdate>,
): Generator<unknown, void, ReturnType<typeof selectTestExecutions>> {
  const { testId, status } = action.payload;

  yield put(
    updateExecutionStatus({
      testId,
      status,
    }),
  );

  // Clear cancelRequested flag when reaching a terminal status so UI resets cleanly
  const isTerminal =
    status === TestStatus.CANCELLED ||
    status === TestStatus.FAILED ||
    status === TestStatus.COMPLETED;
  if (isTerminal) {
    yield put(
      updateExecutionCancelRequested({ testId, cancelRequested: false }),
    );
  }

  // Refresh test cases when execution status changes (e.g. completed/failed)
  yield put(refreshExecutionCasesRequest({ testId }));

  const prefix = terminalStatusToastMessage[status];
  const variant = terminalStatusToastVariant[status];
  if (!prefix || !variant) {
    return;
  }

  // Suppress duplicate toasts: only notify once per (testId, status) combo
  if (notifiedStatusMap.get(testId) === status) {
    return;
  }
  notifiedStatusMap.set(testId, status);

  const message = `${prefix} ${testId}`;
  if (variant === 'success') {
    toastService.success(message, {
      autoClose: 4000,
      clearExisting: false,
    });
  } else {
    toastService.error(message, {
      autoClose: 4000,
      clearExisting: false,
    });
  }
}

function* handleRefreshExecutionCases(
  action: ReturnType<typeof refreshExecutionCasesRequest>,
): Generator<unknown, void, TestCaseEntryForLogs[]> {
  const { testId } = action.payload;
  try {
    const result: TestCaseEntryForLogs[] = yield call(
      getTestCasesByExecutionId,
      testId,
    );
    yield put(
      setExecutionCases({
        testId,
        testCases: result,
      }),
    );
  } catch (error) {
    console.warn(
      `[handleRefreshExecutionCases] Failed to refresh cases for ${testId}:`,
      error,
    );
  }
}

function* handleDownloadLogs(
  action: ReturnType<typeof downloadLogsRequest>,
): Generator<unknown, void, Blob> {
  const { tabId, testId } = action.payload;

  try {
    const logBlob: Blob = yield call(downloadTestLog, testId);

    const url = window.URL.createObjectURL(logBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `test-log-${testId}.txt`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    yield put(
      downloadLogsSuccess({
        tabId,
      }),
    );
  } catch (error) {
    console.error('Failed to download test logs:', error);
    yield put(
      downloadLogsFailure({
        tabId,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to download test logs',
      }),
    );
  }
}

function* handleLoadTestExecution(
  action: ReturnType<typeof loadTestExecutionRequest>,
) {
  const { testId } = action.payload;

  const normalizeExecutionValue = (value?: string | null): string => {
    const normalized = (value ?? '').trim();
    return normalized.toLowerCase() === 'unknown' ? '' : normalized;
  };

  try {
    const state: ReturnType<typeof selectTestExecutions> =
      yield select(selectTestExecutions);

    // Check if test execution already exists in any tab
    const existingTabId = state.tabOrder.find((id) => {
      const exec = state.tabsById[id]?.values.data.testExecution;
      return exec && exec.testId === testId;
    });

    if (existingTabId) {
      // Test execution already exists, just set it as active
      yield put(loadTestExecutionSuccess({ tabId: existingTabId, testId }));
      return;
    }

    // Fetch test execution details from backend
    const execution = (yield call(getTestExecution, testId)) as Awaited<
      ReturnType<typeof getTestExecution>
    >;

    if (!execution) {
      yield put(loadTestExecutionFailure('Test execution not found'));
      toastService.error('Test execution not found');
      return;
    }

    let executionSummary: TestExecutionForTable | null = null;
    try {
      executionSummary = (yield call(
        getTestExecutionForTable,
        testId,
      )) as TestExecutionForTable;
    } catch {
      executionSummary = null;
    }

    const resolvedDeviceFamily = normalizeExecutionValue(
      execution.deviceFamily,
    );
    const resolvedDeviceType = normalizeExecutionValue(
      execution.deviceType || executionSummary?.deviceName,
    );
    const resolvedBuildId = normalizeExecutionValue(
      execution.buildId || executionSummary?.buildId,
    );
    const resolvedTestPlanName = normalizeExecutionValue(
      execution.testPlanName || executionSummary?.testPlanName,
    );

    // Create a new tab with the execution data
    const newTabId = generateTabId();
    yield put(createTabSuccess({ tabId: newTabId }));

    console.log('[LoadTestExecution] Created new tab:', newTabId);
    console.log('[LoadTestExecution] Execution data:', {
      deviceFamily: resolvedDeviceFamily,
      deviceType: resolvedDeviceType,
      buildId: resolvedBuildId,
      testPlanId: execution.testPlanId,
    });

    // Update tab name with test plan name
    if (resolvedTestPlanName) {
      yield put(updateTabName({ tabId: newTabId, name: resolvedTestPlanName }));
    }

    // Set filters first without triggering cascade clearing
    yield put(
      setTabFiltersFromExecution({
        tabId: newTabId,
        filters: {
          deviceFamily: resolvedDeviceFamily,
          deviceType: resolvedDeviceType,
          buildID: resolvedBuildId,
          testPlan: execution.testPlanId ? String(execution.testPlanId) : null,
        },
      }),
    );

    // Now trigger cascade of data fetching based on execution data
    // Fetch device families first (for the dropdown)
    console.log('[LoadTestExecution] Fetching device families');
    yield put(fetchDeviceFamiliesRequest({ tabId: newTabId }));

    // Fetch device types if deviceFamily is set
    if (resolvedDeviceFamily) {
      console.log(
        '[LoadTestExecution] Fetching device types for:',
        resolvedDeviceFamily,
      );
      yield put(
        fetchDeviceTypesRequest({
          tabId: newTabId,
          deviceFamily: resolvedDeviceFamily,
        }),
      );
    }

    // Fetch builds if deviceType is set
    if (resolvedDeviceType) {
      console.log(
        '[LoadTestExecution] Fetching builds for device type:',
        resolvedDeviceType,
      );
      yield put(
        fetchBuildsRequest({
          tabId: newTabId,
          deviceType: resolvedDeviceType,
        }),
      );
    }

    // Fetch test plans
    console.log('[LoadTestExecution] Fetching test plans');
    yield put(fetchTabTestPlansRequest({ tabId: newTabId }));

    // Fetch test suites if testPlanId is set
    if (execution.testPlanId) {
      console.log(
        '[LoadTestExecution] Fetching test suites for plan:',
        execution.testPlanId,
      );
      yield put(
        fetchTabTestSuitesRequest({
          tabId: newTabId,
          planId: Number(execution.testPlanId),
        }),
      );
    }

    // Restore selection state from selectionInput if available
    if (execution.selectionInput) {
      yield put(
        restoreSelectionFromInput({
          tabId: newTabId,
          selectionInput: execution.selectionInput,
        }),
      );
    }

    // Fetch test cases for the execution
    const testCases: TestCaseEntryForLogs[] = yield call(
      getTestCasesByExecutionId,
      testId,
    );

    // Set execution data in the tab
    const tabExecution = {
      testId: execution.testId,
      status: execution.status,
      logs: execution.logs || [],
      testCases: testCases || [],
      deviceFamily: resolvedDeviceFamily,
      deviceType: resolvedDeviceType,
      buildId: resolvedBuildId,
      testPlanId: execution.testPlanId,
      startedAt: execution.createdAt,
      endedAt: execution.updatedAt,
      cancelRequested: execution.cancelRequested ?? false,
    };

    yield put(setTabExecution({ tabId: newTabId, execution: tabExecution }));

    // Success - tab is now loaded with execution data
    yield put(loadTestExecutionSuccess({ tabId: newTabId, testId }));

    toastService.success('Test execution loaded successfully');
  } catch (error) {
    console.error('Failed to load test execution:', error);
    yield put(
      loadTestExecutionFailure(
        error instanceof Error
          ? error.message
          : 'Failed to load test execution',
      ),
    );
    toastService.error('Failed to load test execution');
  }
}

export function* watchTabs() {
  yield all([
    takeLatest(createTabRequest.type, handleCreateTab),
    takeLatest(deleteTabRequest.type, handleDeleteTab),

    takeLatest(fetchDeviceFamiliesRequest.type, handleFetchDeviceFamilies),
    takeLatest(fetchDeviceTypesRequest.type, handleFetchDeviceTypes),
    takeLatest(fetchBuildsRequest.type, handleFetchBuilds),
    takeLatest(fetchBuildsForDeviceTypeRequest.type, handleFetchBuilds),
    takeLatest(fetchTabTestPlansRequest.type, handleFetchTestPlans),
    takeLatest(fetchTabTestSuitesRequest.type, handleFetchTestSuites),
    takeLatest(fetchTestCasesRequest.type, handleFetchTestCases),

    takeLatest(submitNewTestExecutionRequest.type, handleSubmitTestExecution),
    takeLatest(loadTestExecutionRequest.type, handleLoadTestExecution),

    takeLatest(setActiveTab.type, handleActiveTabChanged),

    takeEvery(wsExecutionLogReceived.type, handleWsLogUpsert),
    takeEvery(wsExecutionStatusUpdate.type, handleWsExecutionStatusUpdate),
    debounce(
      500,
      refreshExecutionCasesRequest.type,
      handleRefreshExecutionCases,
    ),
    takeLatest(downloadLogsRequest.type, handleDownloadLogs),
  ]);
}

export default watchTabs;
