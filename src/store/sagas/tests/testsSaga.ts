import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  setDeviceID,
  setBuildID,
  setTestPlan,
  fetchAllTestCasesRequest,
  fetchAllTestCasesSuccess,
  fetchAllTestCasesFailure,
  testExecutionRequest,
  testExecutionFailure,
  testExecutionSuccess,
  getTestExecutionRequest,
  getTestExecutionFailure,
  getTestExecutionSuccess,
  getTestExecutionResultRequest,
  getTestExecutionResultFailure,
  getTestExecutionResultSuccess,
  fetchTestExecutionsRequest,
  fetchTestExecutionsSuccess,
  fetchTestExecutionsFailure,
  getSelectedTestExecutionRequest,
  getSelectedTestExecutionFailure,
  getSelectedTestExecutionSuccess,
  fetchTestExecutionAnalyticsRequest,
  fetchTestExecutionAnalyticsFailure,
  fetchTestExecutionAnalyticsSuccess,
  getInProgressTestExecutionsFailure,
  getInProgressTestExecutionsSuccess,
  getInProgressTestExecutionsRequest,
  getSingleTestExecutionResultRequest,
  getSingleTestExecutionResultSuccess,
  getSingleTestExecutionResultFailure,
  cancelTestExecutionFailure,
  cancelTestExecutionRequest,
  cancelTestExecutionSuccess,
  fetchInProgressTestsListFailure,
  fetchInProgressTestsListRequest,
  fetchInProgressTestsListSuccess,
  fetchTestExecutionForDeviceFailure,
  fetchTestExecutionForDeviceRequest,
  fetchTestExecutionForDeviceSuccess,
  downloadTestExecutionSuccess,
  downloadTestExecutionFailure,
  downloadTestExecutionRequest,
  fetchTestPlanSummaryRequest,
  fetchTestPlanSummarySuccess,
  fetchTestPlanSummaryFailure,
  fetchTestCasesRequest,
  fetchTestCasesSuccess,
  fetchTestSuitesRequest,
  fetchTestSuitesFailure,
  fetchTestCasesFailure,
  fetchTestSuitesSuccess,
  fetchTestPlansRequest,
  fetchTestPlansSuccess,
  fetchTestPlansFailure,
  setBuildIDSuccess,
  setBuildIDFailure,
} from 'store/slices/tests/testsSlice';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  TestCaseByTestSuits,
  TestExecutionResponse,
  TestExecutionsForTableResponse,
  TestExecutionAnalyticsResponse,
  InProgressTestExecutionResponse,
  TestExecutionForTable,
  TestExecutionResultResponse,
  InProgressTestsList,
  TestPlanSummary,
  TestPlan,
  TestCase,
  TestSuite,
  TestCaseEntry,
} from 'typesCustom/tests';
import {
  cancelTestExecution,
  downloadTestExecutionCSV,
  fetchAllTestCases,
  fetchTestCasesList,
  fetchTestExecutions,
  fetchTestPlanList,
  fetchTestSuitesList,
  getInProgressTestExecutionList,
  getTestExecution,
  getTestExecutionByDevice,
  getTestExecutionForTable,
  getTestExecutionLatest,
  getTestExecutionResults,
  testExecution,
} from 'services/testsApiService';
import { RootState } from 'store/store';
import { AxiosError } from 'axios';
import {
  fetchTestPlanSummary,
  getTestExecutionAnalytics,
} from 'services/analyticsApiService';
import { fetchBuildsForDeviceRequest } from 'store/slices/device/deviceSlice';
import {
  clearTabExecution,
  updateExecutionCancelRequested,
} from 'store/slices/testExecution/testExecutionsSlice';
import { selectActiveTabId } from 'store/slices/testExecution/selectors';

const getDeviceID = (state: RootState) => state.tests.selectedData.deviceID;
// const getBuildID = (state: RootState) => state.tests.selectedData.buildID;
const getTestPlan = (state: RootState) => state.tests.selectedData.testPlan;
const getTestCasesBySuiteId = (state: RootState) =>
  state.tests.testCasesBySuiteId;
const getCurrentTestExecutionId = (state: RootState) =>
  state.tests.currentTestExecution?.testId;

// const getTestPlans = (state: RootState) => state.tests.testPlans;
// const getTestCases = (state: RootState) => state.tests.testCases;
// const getTestSuites = (state: RootState) => state.tests.testSuites;

// function* handleDeviceFamilyChange(action: PayloadAction<string>) {
//   if (!isEmpty(action.payload)) {
//     yield put(
//       fetchDevicesForUserRequest({
//         deviceFamily: action.payload,
//       }),
//     );
//     yield put(fetchInProgressTestsListRequest());
//   } else {
//     yield put(resetDevices());
//   }
// }

function* handleDeviceIDChange(action: PayloadAction<string>) {
  yield put(fetchBuildsForDeviceRequest(action.payload));
  yield put(fetchTestExecutionForDeviceRequest(action.payload));
}

function* handleBuildIDChange(action: PayloadAction<string>) {
  try {
    const deviceID: ReturnType<typeof getDeviceID> = yield select(getDeviceID);
    yield put(
      fetchTestPlansRequest({
        buildId: action.payload,
        deviceId: deviceID,
      }),
    );
    yield put(setBuildIDSuccess(action.payload));
  } catch (error) {
    if (error instanceof Error) {
      yield put(setBuildIDFailure(error.message || 'Failed to set build ID'));
    } else {
      yield put(setBuildIDFailure('Failed to failed to set build ID'));
    }
  }
}

function* handleTestPlanChange(action: PayloadAction<number>) {
  yield put(fetchTestSuitesRequest({ planId: action.payload }));
}

function* fetchTestPlansSaga(action: ReturnType<typeof fetchTestPlansRequest>) {
  const buildId = action.payload.buildId;
  const deviceId = action.payload.deviceId;
  try {
    const response: TestPlan[] = yield call(fetchTestPlanList, {
      buildId,
      deviceId,
    });
    console.log('response', response);
    yield put(
      fetchTestPlansSuccess({
        buildId,
        items: response,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchTestPlansFailure({
          error: error.message || 'Failed to fetch test plans',
          buildId,
        }),
      );
    } else {
      yield put(
        fetchTestPlansFailure({ buildId, error: 'Failed to fetch test plans' }),
      );
    }
  }
}

function* fetchTestSuitesSaga(
  action: ReturnType<typeof fetchTestSuitesRequest>,
) {
  const { planId } = action.payload;
  try {
    const response: TestSuite[] = yield call(fetchTestSuitesList, {
      planId,
    });
    yield put(
      fetchTestSuitesSuccess({
        planId,
        items: response,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchTestSuitesFailure({
          planId,
          error: error.message || 'Failed to fetch test suites',
        }),
      );
    } else {
      yield put(
        fetchTestSuitesFailure({
          planId,
          error: 'Failed to fetch test suites',
        }),
      );
    }
  }
}

function* fetchTestCasesSaga(action: ReturnType<typeof fetchTestCasesRequest>) {
  const { suiteId } = action.payload;
  try {
    const testPlan: ReturnType<typeof getTestPlan> = yield select(getTestPlan);
    const response: TestCase[] = yield call(fetchTestCasesList, {
      suiteId,
      ...(testPlan != null ? { planId: testPlan } : {}),
    });
    yield put(
      fetchTestCasesSuccess({
        suiteId,
        items: response,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchTestCasesFailure({
          suiteId,
          error: error.message || 'Failed to fetch test cases',
        }),
      );
    } else {
      yield put(
        fetchTestCasesFailure({ suiteId, error: 'Failed to fetch test cases' }),
      );
    }
  }
}

function* handleFetchAllTestCases(
  action: ReturnType<typeof fetchAllTestCasesRequest>,
) {
  try {
    const testCasesBySuiteId: ReturnType<typeof getTestCasesBySuiteId> =
      yield select(getTestCasesBySuiteId);
    if (!testCasesBySuiteId[action.payload]) {
      const getTestCases: TestCaseByTestSuits = yield call(
        fetchAllTestCases,
        action.payload,
      );
      yield put(fetchAllTestCasesSuccess(getTestCases));
    } else {
      yield put(fetchAllTestCasesSuccess(null));
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchAllTestCasesFailure(
          error.message || 'Failed to fetch test cases by plan',
        ),
      );
    } else {
      yield put(fetchAllTestCasesFailure('Failed to fetch test cases by plan'));
    }
  }
}

function* handleTestExecution(action: ReturnType<typeof testExecutionRequest>) {
  try {
    action.payload.testCases = Object.entries(
      action.payload.testCases ?? {},
    ).reduce(
      (acc, [suiteId, cases]) => {
        acc[Number(suiteId)] = cases.map(
          ({ result: _r, executionId: _e, ...rest }) => rest,
        );
        return acc;
      },
      {} as Record<number, Omit<TestCaseEntry, 'result' | 'executionId'>[]>,
    );
    const testResponse: TestExecutionResponse = yield call(
      testExecution,
      action.payload,
    );
    yield put(testExecutionSuccess(testResponse));
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.message) {
      yield put(testExecutionFailure(error.response?.data?.message));
    } else if (error instanceof Error) {
      yield put(
        testExecutionFailure(error.message || 'Failed to execute test'),
      );
    } else {
      yield put(testExecutionFailure('Failed to execute test'));
    }
  }
}

function* handleTestExecutionRequest(
  action: ReturnType<typeof getTestExecutionRequest>,
) {
  try {
    const testExecution: TestExecutionResponse = action.payload
      ? yield call(getTestExecution, action.payload)
      : yield call(getTestExecutionLatest);

    yield put(getTestExecutionSuccess(testExecution));
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.message) {
      yield put(getTestExecutionFailure(error.response?.data?.message));
    } else if (error instanceof Error) {
      yield put(
        getTestExecutionFailure(
          error.message || 'Failed to get test execution',
        ),
      );
    } else {
      yield put(getTestExecutionFailure('Failed to get test execution'));
    }
  }
}

function* handleTestExecutionResultRequest(
  action: ReturnType<typeof getTestExecutionResultRequest>,
) {
  try {
    const currentTestExecutionId: ReturnType<typeof getCurrentTestExecutionId> =
      yield select(getCurrentTestExecutionId);
    if (currentTestExecutionId && currentTestExecutionId === action.payload) {
      const testCases: TestExecutionResultResponse = yield call(
        getTestExecutionResults,
        action.payload,
      );
      yield put(getTestExecutionResultSuccess(testCases));
    }
    yield put(fetchTestPlanSummaryRequest());
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        getTestExecutionResultFailure(
          error.message || 'Failed to get test execution results',
        ),
      );
    } else {
      yield put(
        getTestExecutionResultFailure('Failed to get test execution results'),
      );
    }
  }
}

function* handleFetchTestExecutions(
  action: ReturnType<typeof fetchTestExecutionsRequest>,
) {
  try {
    const testExecutions: TestExecutionsForTableResponse = yield call(
      fetchTestExecutions,
      action.payload,
    );
    yield put(fetchTestExecutionsSuccess(testExecutions));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchTestExecutionsFailure(
          error.message || 'Failed to fetch test executions',
        ),
      );
    } else {
      yield put(fetchTestExecutionsFailure('Failed to fetch test executions'));
    }
  }
}

function* handleSelectedTestExecution(
  action: ReturnType<typeof getSelectedTestExecutionRequest>,
) {
  try {
    const testExecution: TestExecutionResponse = yield call(
      getTestExecution,
      action.payload,
    );
    yield put(getSelectedTestExecutionSuccess(testExecution));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        getSelectedTestExecutionFailure(
          error.message || 'Failed to fetch test execution',
        ),
      );
    } else {
      yield put(
        getSelectedTestExecutionFailure('Failed to fetch test execution'),
      );
    }
  }
}

function* handleFetchTestExecutionAnalytics() {
  try {
    const testExecution: TestExecutionAnalyticsResponse = yield call(
      getTestExecutionAnalytics,
      'execution',
    );
    yield put(fetchTestExecutionAnalyticsSuccess(testExecution));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchTestExecutionAnalyticsFailure(
          error.message || 'Failed to fetch test execution analytics',
        ),
      );
    } else {
      yield put(
        fetchTestExecutionAnalyticsFailure(
          'Failed to fetch test execution analytics',
        ),
      );
    }
  }
}

function* handleInProgressTestExecutions() {
  try {
    const inProgressExecutions: InProgressTestExecutionResponse[] = yield call(
      getTestExecutionAnalytics,
      'inProgress',
    );
    yield put(getInProgressTestExecutionsSuccess(inProgressExecutions));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        getInProgressTestExecutionsFailure(
          error.message || 'Failed to fetch in-progress test executions',
        ),
      );
    } else {
      yield put(
        getInProgressTestExecutionsFailure(
          'Failed to fetch in-progress test executions',
        ),
      );
    }
  }
}

function* handleSingleTestExecutionResult(
  action: ReturnType<typeof getSingleTestExecutionResultRequest>,
) {
  try {
    const testExecutionForTable: TestExecutionForTable = yield call(
      getTestExecutionForTable,
      action.payload,
    );
    yield put(getSingleTestExecutionResultSuccess(testExecutionForTable));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        getSingleTestExecutionResultFailure(
          error.message || 'Get Single test execution result failed',
        ),
      );
    } else {
      yield put(
        getSingleTestExecutionResultFailure(
          'Get Single test execution result failed',
        ),
      );
    }
  }
}

function* handleTestExecutionCancel(
  action: ReturnType<typeof cancelTestExecutionRequest>,
) {
  try {
    // Optimistically mark as cancelling so the stop button disables immediately
    yield put(
      updateExecutionCancelRequested({
        testId: action.payload,
        cancelRequested: true,
      }),
    );

    // yield delay(1000);
    const response: TestExecutionResponse = yield call(
      cancelTestExecution,
      action.payload,
    );
    yield put(cancelTestExecutionSuccess(response));

    // Do NOT clear tab execution or fetch single result here.
    // The backend cancel is async — the WS status update (CANCELLED/FAILED)
    // will naturally transition the UI when the cancel actually completes.
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.message) {
      yield put(cancelTestExecutionFailure(error.response?.data?.message));
    } else if (error instanceof Error) {
      yield put(
        cancelTestExecutionFailure(
          error.message || 'Failed to cancel the test execution',
        ),
      );
    } else {
      yield put(
        cancelTestExecutionFailure('Failed to cancel the test execution'),
      );
    }
  }
}

function* handleInProgressTestsList() {
  try {
    const response: InProgressTestsList[] = yield call(
      getInProgressTestExecutionList,
    );
    yield put(fetchInProgressTestsListSuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchInProgressTestsListFailure(
          error.message || 'Failed to fetch in progress tests lists',
        ),
      );
    } else {
      yield put(
        fetchInProgressTestsListFailure(
          'Failed to fetch in progress tests lists',
        ),
      );
    }
  }
}

function* handleTestExecutionForDevice(
  action: ReturnType<typeof fetchTestExecutionForDeviceRequest>,
) {
  try {
    const response: TestExecutionResponse = yield call(
      getTestExecutionByDevice,
      action.payload,
    );
    yield put(fetchTestExecutionForDeviceSuccess(response));
    yield put(
      fetchTestPlansRequest({
        deviceId: response.deviceId,
        buildId: response.buildId,
      }),
    );
    yield put(fetchAllTestCasesRequest(response.testPlanId));
  } catch (error) {
    console.log('error', error);
    if (error instanceof Error) {
      yield put(
        fetchTestExecutionForDeviceFailure(
          error.message || 'Failed to fetch test execution for device',
        ),
      );
    } else {
      yield put(
        fetchTestExecutionForDeviceFailure(
          'Failed to fetch test execution for device',
        ),
      );
    }
  }
}

function* handleDownloadTestExecution() {
  try {
    const blob: Blob = yield call(downloadTestExecutionCSV);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devices-${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    yield put(downloadTestExecutionSuccess());
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        downloadTestExecutionFailure(error.message || 'Failed to download CSV'),
      );
    } else {
      yield put(downloadTestExecutionFailure('Failed to download CSV'));
    }
  }
}

function* handleFetchTestPlanSummary() {
  try {
    const response: TestPlanSummary = yield call(fetchTestPlanSummary);
    yield put(fetchTestPlanSummarySuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchTestPlanSummaryFailure(
          error.message || 'Failed to fetch test plan summary',
        ),
      );
    } else {
      yield put(
        fetchTestPlanSummaryFailure('Failed to fetch test plan summary'),
      );
    }
  }
}

export function* watchTestsFormSaga() {
  // yield takeLatest(setDeviceFamily.type, handleDeviceFamilyChange);
  yield takeLatest(setDeviceID.type, handleDeviceIDChange);
  yield takeLatest(setBuildID.type, handleBuildIDChange);
  yield takeLatest(setTestPlan.type, handleTestPlanChange);
  yield takeLatest(fetchTestCasesRequest.type, fetchTestCasesSaga);
  yield takeLatest(fetchTestSuitesRequest.type, fetchTestSuitesSaga);
  yield takeLatest(fetchTestPlansRequest.type, fetchTestPlansSaga);

  yield takeLatest(fetchAllTestCasesRequest.type, handleFetchAllTestCases);
  yield takeLatest(testExecutionRequest.type, handleTestExecution);
  yield takeLatest(getTestExecutionRequest.type, handleTestExecutionRequest);
  yield takeLatest(
    getTestExecutionResultRequest.type,
    handleTestExecutionResultRequest,
  );
  yield takeLatest(fetchTestExecutionsRequest.type, handleFetchTestExecutions);
  yield takeLatest(
    getSelectedTestExecutionRequest.type,
    handleSelectedTestExecution,
  );
  yield takeLatest(
    fetchTestExecutionAnalyticsRequest.type,
    handleFetchTestExecutionAnalytics,
  );
  yield takeLatest(
    getInProgressTestExecutionsRequest.type,
    handleInProgressTestExecutions,
  );
  yield takeLatest(
    getSingleTestExecutionResultRequest.type,
    handleSingleTestExecutionResult,
  );
  yield takeLatest(cancelTestExecutionRequest.type, handleTestExecutionCancel);
  yield takeLatest(
    fetchInProgressTestsListRequest.type,
    handleInProgressTestsList,
  );
  yield takeLatest(
    fetchTestExecutionForDeviceRequest.type,
    handleTestExecutionForDevice,
  );
  yield takeLatest(
    downloadTestExecutionRequest.type,
    handleDownloadTestExecution,
  );
  yield takeLatest(
    fetchTestPlanSummaryRequest.type,
    handleFetchTestPlanSummary,
  );
}
