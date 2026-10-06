import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import dayjs from 'dayjs';
import {
  downloadTestLog,
  fetchTestExecutions,
  getTestCasesByExecutionId,
  getTestExecutionForTable,
  generateExecutionReport,
  uploadExecutionReport,
  getExecutionReport,
} from 'services/testsApiService';
import { GITLAB_FILE_PATH } from 'constants/config';
import toastService from 'services/ToastService';
import {
  fetchRecentBuildsComparison,
  fetchRecentBuildComparisonById,
  fetchRecentTestExecutionById,
  fetchRecentTestExecutionsActivity,
  fetchExecutionStatusDailySummary,
} from 'services/analyticsApiService';
import {
  downloadUserDashboardExecutionLogFailure,
  downloadUserDashboardExecutionLogRequest,
  downloadUserDashboardExecutionLogSuccess,
  fetchUserDashboardActivityByTestIdFailure,
  fetchUserDashboardActivityByTestIdRequest,
  fetchUserDashboardActivityByTestIdSuccess,
  fetchUserDashboardBuildPerformanceByIdFailure,
  fetchUserDashboardBuildPerformanceByIdRequest,
  fetchUserDashboardBuildPerformanceByIdSuccess,
  fetchUserDashboardExecutionDailySummaryFailure,
  fetchUserDashboardExecutionDailySummaryRequest,
  fetchUserDashboardExecutionDailySummarySuccess,
  refreshUserDashboardDailySummaryRequest,
  fetchUserDashboardDataFailure,
  fetchUserDashboardDataRequest,
  fetchUserDashboardDataSuccess,
  fetchUserDashboardExecutionFailure,
  fetchUserDashboardExecutionRequest,
  fetchUserDashboardExecutionSuccess,
  fetchUserDashboardTestCasesByExecutionIdFailure,
  fetchUserDashboardTestCasesByExecutionIdRequest,
  fetchUserDashboardTestCasesByExecutionIdSuccess,
  generateExecutionReportRequest,
  generateExecutionReportSuccess,
  generateExecutionReportFailure,
  fetchExecutionReportStatusRequest,
  fetchExecutionReportStatusSuccess,
  uploadExecutionReportRequest,
  uploadExecutionReportSuccess,
  uploadExecutionReportFailure,
} from 'store/slices/userDashboard/userDashboardSlice';
import {
  selectUserDashboardHasExecutionTestCasesLoaded,
  selectUserDashboardTrendFrom,
  selectUserDashboardTrendTo,
} from 'store/selectors/userDashboardSelectors';
import type { RootState } from 'store/store';
import type {
  TestSuiteCase,
  TestSuiteCaseStatus,
} from 'components/UserDashboard/shared/TestSuiteDrawer';
import type { ExecutionReportStatus } from 'store/slices/userDashboard/userDashboardSlice';
import type { DashboardTableRow } from 'components/UserDashboard/shared/testExecutionData';
import type {
  TestCaseEntryForLogs,
  TestExecutionForTable,
  TestExecutionsForTableResponse,
} from 'types/tests';
import type {
  UserBuildComparisonData,
  TestExecutionActivity,
  ExecutionDailySummary,
} from 'typesCustom/analytics';

type DashboardExecutionSource = TestExecutionForTable &
  Partial<DashboardTableRow>;

const toDashboardTableRow = (
  execution: DashboardExecutionSource,
): DashboardTableRow => ({
  ...execution,
  createdAt:
    typeof execution.createdAt === 'string'
      ? execution.createdAt
      : new Date().toISOString(),
  deviceType: execution.deviceType ?? execution.deviceName ?? '',
  testCycleId: execution.testCycleId ?? '',
});

const buildExecutionSteps = (scriptFile?: string) => {
  const fileName = scriptFile?.trim() || 'N/A';

  return [
    `Check for the file ${fileName} in the specified directory.`,
    'If the file is found, make it executable.',
    'Execute the file.',
    'Verify whether the result is PASS or FAIL.',
    'Send the result to the Form Controller.',
    'If the execution fails, create a Jira ticket.',
    'Update the test result in TestRail.',
    'Mark the test as completed.',
  ];
};

const mapScriptUrl = (scriptFile?: string): string | undefined => {
  const file = scriptFile?.trim();
  if (!file) return undefined;

  if (/^https?:\/\//i.test(file)) {
    return file;
  }

  const base = GITLAB_FILE_PATH?.trim();
  if (!base) return undefined;

  return `${base.replace(/\/+$/, '')}/${file.replace(/^\/+/, '')}`;
};

const mapTestCaseResultToStatus = (result?: string): TestSuiteCaseStatus => {
  const normalized = (result || '').trim().toUpperCase();

  if (
    normalized === 'PASS' ||
    normalized === 'PASSED' ||
    normalized === 'SUCCESS' ||
    normalized === 'SUCCEEDED' ||
    normalized === 'OK'
  ) {
    return 'passed';
  }

  if (
    normalized === 'FAIL' ||
    normalized === 'FAILED' ||
    normalized === 'FAILURE' ||
    normalized === 'ERROR' ||
    normalized === 'KO'
  ) {
    return 'failed';
  }

  return 'pending';
};

const mapExecutionTestCases = (
  executionId: string,
  testCases: TestCaseEntryForLogs[],
): TestSuiteCase[] => {
  const sortedCases = [...(testCases || [])].sort((left, right) => {
    const leftId = left.id ?? 0;
    const rightId = right.id ?? 0;
    return leftId - rightId;
  });

  return sortedCases.map((testCase) => {
    const status = mapTestCaseResultToStatus(testCase.result);

    const jiraUrl =
      testCase.jiraDefect && /^https?:\/\//i.test(testCase.jiraDefect)
        ? testCase.jiraDefect
        : undefined;

    return {
      id: `${executionId}-${testCase.testCaseId ?? testCase.id}`,
      name: testCase.title || `Case ${testCase.testCaseId}`,
      device: '',
      duration: '',
      executedAt: testCase.updatedAt
        ? dayjs(testCase.updatedAt).format('HH:mm:ss')
        : '-',
      status,
      issueLabel: status === 'failed' && jiraUrl ? 'View Issue' : undefined,
      jiraUrl,
      gitlabUrl: mapScriptUrl(testCase.scriptFile),
      outputFilePath: testCase.outputFilePath,
      dmesgFilePath: testCase.dmesgFilePath,
      steps: buildExecutionSteps(testCase.scriptFile),
    };
  });
};

function* fetchUserDashboardDataSaga() {
  try {
    const [response, activities, buildsComparison]: [
      TestExecutionsForTableResponse,
      TestExecutionActivity[],
      UserBuildComparisonData[],
    ] = yield all([
      call(fetchTestExecutions, {
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        desc: 'true',
      }),
      call(fetchRecentTestExecutionsActivity),
      call(fetchRecentBuildsComparison),
    ]);

    yield put(
      fetchUserDashboardDataSuccess({
        executions: Array.isArray(response.data)
          ? response.data.map((execution) =>
              toDashboardTableRow(execution as DashboardExecutionSource),
            )
          : [],
        activities: Array.isArray(activities) ? activities : [],
        buildsComparison: Array.isArray(buildsComparison)
          ? buildsComparison
          : [],
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch user dashboard data';
    yield put(fetchUserDashboardDataFailure(message));
  }
}

function* fetchUserDashboardExecutionSaga(
  action: ReturnType<typeof fetchUserDashboardExecutionRequest>,
) {
  try {
    const response: DashboardExecutionSource = yield call(
      getTestExecutionForTable,
      action.payload.testId,
    );
    yield put(
      fetchUserDashboardExecutionSuccess({
        execution: toDashboardTableRow(response),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch updated dashboard execution';
    yield put(fetchUserDashboardExecutionFailure(message));
  }
}

function* fetchUserDashboardTestCasesByExecutionIdSaga(
  action: ReturnType<typeof fetchUserDashboardTestCasesByExecutionIdRequest>,
) {
  const { executionId, force = false } = action.payload;

  try {
    const alreadyLoaded: boolean = yield select((state: RootState) =>
      selectUserDashboardHasExecutionTestCasesLoaded(state, executionId),
    );

    if (alreadyLoaded && !force) {
      return;
    }

    const testCases: TestCaseEntryForLogs[] = yield call(
      getTestCasesByExecutionId,
      executionId,
    );

    yield put(
      fetchUserDashboardTestCasesByExecutionIdSuccess({
        executionId,
        cases: mapExecutionTestCases(executionId, testCases),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load test cases';

    yield put(
      fetchUserDashboardTestCasesByExecutionIdFailure({
        executionId,
        error: message,
      }),
    );
  }
}

function* fetchUserDashboardActivityByTestIdSaga(
  action: ReturnType<typeof fetchUserDashboardActivityByTestIdRequest>,
) {
  try {
    const activity: TestExecutionActivity = yield call(
      fetchRecentTestExecutionById,
      action.payload.testId,
    );
    yield put(fetchUserDashboardActivityByTestIdSuccess({ activity }));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch dashboard activity';
    yield put(fetchUserDashboardActivityByTestIdFailure(message));
  }
}

function* fetchUserDashboardBuildPerformanceByIdSaga(
  action: ReturnType<typeof fetchUserDashboardBuildPerformanceByIdRequest>,
) {
  try {
    const buildPerformance: UserBuildComparisonData = yield call(
      fetchRecentBuildComparisonById,
      action.payload.buildId,
    );
    yield put(
      fetchUserDashboardBuildPerformanceByIdSuccess({ buildPerformance }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch build performance';
    yield put(fetchUserDashboardBuildPerformanceByIdFailure(message));
  }
}

function* downloadUserDashboardExecutionLogSaga(
  action: ReturnType<typeof downloadUserDashboardExecutionLogRequest>,
) {
  try {
    const blob: Blob = yield call(downloadTestLog, action.payload.testId);

    if (typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${action.payload.testId}_test_log.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    yield put(downloadUserDashboardExecutionLogSuccess());
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to download execution log';
    yield put(downloadUserDashboardExecutionLogFailure(message));
  }
}

function* fetchUserDashboardExecutionDailySummarySaga(
  action: ReturnType<typeof fetchUserDashboardExecutionDailySummaryRequest>,
) {
  try {
    const summary: ExecutionDailySummary[] = yield call(
      fetchExecutionStatusDailySummary,
      action.payload.from,
      action.payload.to,
    );
    yield put(fetchUserDashboardExecutionDailySummarySuccess({ summary }));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch execution daily summary';
    yield put(fetchUserDashboardExecutionDailySummaryFailure(message));
  }
}

function* refreshDailySummaryIfTodayInRangeSaga() {
  try {
    const from: string | null = yield select(selectUserDashboardTrendFrom);
    const to: string | null = yield select(selectUserDashboardTrendTo);
    if (!from || !to) return;

    const today = dayjs().format('YYYY-MM-DD');
    if (today < from || today > to) return;

    const summary: ExecutionDailySummary[] = yield call(
      fetchExecutionStatusDailySummary,
      from,
      to,
    );
    yield put(fetchUserDashboardExecutionDailySummarySuccess({ summary }));
  } catch {
    // silently ignore — chart keeps showing previous data
  }
}

function* generateExecutionReportSaga(
  action: ReturnType<typeof generateExecutionReportRequest>,
) {
  try {
    const report: { id: string; status: string } = yield call(
      generateExecutionReport,
      action.payload.testId,
    );
    const reportStatus = (report.status ??
      'generating') as ExecutionReportStatus;
    yield put(
      generateExecutionReportSuccess({
        testId: action.payload.testId,
        reportStatus,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate report';
    yield put(
      generateExecutionReportFailure({
        testId: action.payload.testId,
        error: message,
      }),
    );
  }
}

function* fetchExecutionReportStatusSaga(
  action: ReturnType<typeof fetchExecutionReportStatusRequest>,
) {
  try {
    const report: {
      id: string;
      status: string;
      testExecutionId: string;
      uploadError?: string | null;
    } | null = yield call(getExecutionReport, action.payload.testId);
    if (report) {
      yield put(
        fetchExecutionReportStatusSuccess({
          testId: action.payload.testId,
          reportStatus: report.status as ExecutionReportStatus,
          uploadError: report.uploadError ?? null,
        }),
      );
    }
  } catch {
    // silently ignore — UI keeps polling
  }
}

function* uploadExecutionReportSaga(
  action: ReturnType<typeof uploadExecutionReportRequest>,
) {
  try {
    yield call(uploadExecutionReport, action.payload.testId);
    // Backend returns 202 immediately — actual status comes via WebSocket.
    // Mark upload as accepted; WS events will update to 'uploaded' or 'completed' (with error).
    yield put(uploadExecutionReportSuccess({ testId: action.payload.testId }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start upload';
    toastService.error(message);
    yield put(
      uploadExecutionReportFailure({
        testId: action.payload.testId,
        error: message,
      }),
    );
  }
}

export function* watchUserDashboard() {
  yield takeLatest(
    fetchUserDashboardDataRequest.type,
    fetchUserDashboardDataSaga,
  );
  yield takeEvery(
    fetchUserDashboardExecutionRequest.type,
    fetchUserDashboardExecutionSaga,
  );
  yield takeEvery(
    fetchUserDashboardTestCasesByExecutionIdRequest.type,
    fetchUserDashboardTestCasesByExecutionIdSaga,
  );
  yield takeEvery(
    fetchUserDashboardActivityByTestIdRequest.type,
    fetchUserDashboardActivityByTestIdSaga,
  );
  yield takeEvery(
    fetchUserDashboardBuildPerformanceByIdRequest.type,
    fetchUserDashboardBuildPerformanceByIdSaga,
  );
  yield takeEvery(
    refreshUserDashboardDailySummaryRequest.type,
    refreshDailySummaryIfTodayInRangeSaga,
  );
  yield takeEvery(
    fetchUserDashboardExecutionDailySummaryRequest.type,
    fetchUserDashboardExecutionDailySummarySaga,
  );
  yield takeEvery(
    downloadUserDashboardExecutionLogRequest.type,
    downloadUserDashboardExecutionLogSaga,
  );
  yield takeEvery(
    generateExecutionReportRequest.type,
    generateExecutionReportSaga,
  );
  yield takeEvery(
    fetchExecutionReportStatusRequest.type,
    fetchExecutionReportStatusSaga,
  );
  yield takeEvery(uploadExecutionReportRequest.type, uploadExecutionReportSaga);
}

export default watchUserDashboard;
