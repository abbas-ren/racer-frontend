import { call, put, takeLatest, takeEvery, select } from 'redux-saga/effects';
import {
  fetchDeviceStateAnalyticsFailure,
  fetchDeviceStateAnalyticsRequest,
  fetchDeviceStateAnalyticsSuccess,
  fetchDeviceUsageAnalyticsDailyFailure,
  fetchDeviceUsageAnalyticsDailyRequest,
  fetchDeviceUsageAnalyticsDailySuccess,
  fetchDeviceUsageAnalyticsSummaryFailure,
  fetchDeviceUsageAnalyticsSummaryRequest,
  fetchDeviceUsageAnalyticsSummarySuccess,
  setSelectedDeviceFamily,
  fetchDevicesInFamilySuccess,
  setSelectedDevice,
  setSelectedDate,
  selectSelectedDeviceFamily,
  selectSelectedDevice,
  fetchDeviceByFamiliesRequest,
  fetchDeviceByFamiliesSuccess,
  fetchDeviceByFamiliesFailure,
  fetchBuildsPerformanceRequest,
  fetchBuildsPerformanceSuccess,
  fetchBuildsPerformanceFailure,
  fetchBuildPerformanceByIdRequest,
  fetchBuildPerformanceByIdSuccess,
  fetchBuildPerformanceByIdFailure,
  fetchBuildExecutionsRequest,
  fetchBuildExecutionsSuccess,
  fetchBuildExecutionsFailure,
  fetchBuildExecutionTestCaseByIdRequest,
  fetchBuildExecutionTestCaseByIdSuccess,
  fetchBuildExecutionTestCaseByIdFailure,
  fetchBuildExecutionByTestIdRequest,
  fetchBuildExecutionByTestIdSuccess,
  fetchBuildExecutionByTestIdFailure,
} from 'store/slices';
import {
  fetchDeviceStateDetailedAnalytics,
  fetchDeviceStateAnalytics,
  fetchDeviceUsageAnalyticsDaily,
  fetchDeviceUsageAnalyticsSummary,
  fetchBuildsPerformance,
  fetchBuildPerformanceById,
} from 'services/analyticsApiService';
import {
  fetchTestExecutionByBuild,
  getSingleTestCase,
  getSingleTestExecution,
} from 'services/testsApiService';
import { DeviceState } from 'typesCustom/components';
import {
  DeviceStateDetailedAnalytics,
  DeviceStateAnalytics,
  DeviceUsageAnalyticsDaily,
  DeviceUsageAnalyticsSummary,
  BuildPerformanceData,
} from 'typesCustom/analytics';
import {
  TestCaseByBuild,
  TestExecutionByBuild,
  TestExecutionResponse,
  TestExecutionsByBuildResponse,
} from 'typesCustom/tests';
import { TestCaseEntryForLogs } from 'types/tests';
import { PayloadAction } from '@reduxjs/toolkit';
import { isEmpty } from 'radash';
import type { DeviceResponse } from 'store/types/sagaTypes';
import { fetchDeviceApi } from 'services/deviceApiService';
import { Dayjs } from 'dayjs';
import { DeviceFamilyItem } from 'components/Dashboard/AdminDashboard/types';

function* fetchDeviceStateAnalyticsSaga() {
  try {
    const response: DeviceStateAnalytics = yield call(
      fetchDeviceStateAnalytics,
    );
    yield put(
      fetchDeviceStateAnalyticsSuccess({
        total: response.total,
        stateCount: new Map(
          Object.entries(response.stateCount).map(([key, value]) => [
            key as DeviceState,
            value as number,
          ]),
        ),
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceStateAnalyticsFailure(
          error.message || 'Failed to fetch device state analytics',
        ),
      );
    } else {
      yield put(
        fetchDeviceStateAnalyticsFailure(
          'Failed to fetch device state analytics',
        ),
      );
    }
  }
}

function* handleDeviceUsageDaily(
  action: ReturnType<typeof fetchDeviceUsageAnalyticsDailyRequest>,
) {
  try {
    const response: DeviceUsageAnalyticsDaily = yield call(
      fetchDeviceUsageAnalyticsDaily,
      action.payload,
    );
    yield put(fetchDeviceUsageAnalyticsDailySuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceUsageAnalyticsDailyFailure(
          error.message || 'Failed to fetch daily device usage analytics',
        ),
      );
    } else {
      yield put(
        fetchDeviceUsageAnalyticsDailyFailure(
          'Failed to fetch  daily device usage analytics',
        ),
      );
    }
  }
}

function* handleDeviceUsageSummary() {
  try {
    const response: DeviceUsageAnalyticsSummary = yield call(
      fetchDeviceUsageAnalyticsSummary,
    );
    yield put(fetchDeviceUsageAnalyticsSummarySuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceUsageAnalyticsSummaryFailure(
          error.message || 'Failed to fetch device usage analytics summary',
        ),
      );
    } else {
      yield put(
        fetchDeviceUsageAnalyticsSummaryFailure(
          'Failed to fetch device usage analytics summary',
        ),
      );
    }
  }
}

function* handleDeviceFamilyChange(action: PayloadAction<string>) {
  const isAll = action.payload === 'all';

  const selectedDate: Dayjs | null = yield select(
    (state) => state.dashboard.selectedDate,
  );
  const selectedDevice: string | undefined = yield select(selectSelectedDevice);

  if (!isEmpty(action.payload) && !isAll) {
    const response: DeviceResponse = yield call(fetchDeviceApi, {
      filterBy: 'deviceFamily',
      filter: action.payload,
    });

    yield put(fetchDevicesInFamilySuccess({ ...response }));

    const requestPayload: {
      deviceFamily?: string;
      deviceId?: string;
      day?: string;
    } = {
      deviceFamily: action.payload,
    };

    if (selectedDevice) requestPayload.deviceId = selectedDevice;
    if (selectedDate) requestPayload.day = selectedDate.format('YYYY-MM-DD');

    yield put(fetchDeviceUsageAnalyticsDailyRequest(requestPayload));
  } else {
    // If "all", fetch without filtering
    const response: DeviceResponse = yield call(fetchDeviceApi, {
      limit: 100,
    });
    yield put(fetchDevicesInFamilySuccess({ ...response }));

    const requestPayload: {
      deviceFamily?: string;
      deviceId?: string;
      day?: string;
    } = {};

    if (selectedDevice) requestPayload.deviceId = selectedDevice;
    if (selectedDate) requestPayload.day = selectedDate.format('YYYY-MM-DD');

    yield put(fetchDeviceUsageAnalyticsDailyRequest(requestPayload));
  }
}

function* handleDeviceChange(action: PayloadAction<string>) {
  if (!isEmpty(action.payload)) {
    const selectedDate: Dayjs | null = yield select(
      (state) => state.dashboard.selectedDate,
    );
    const selectedDeviceFamily: string | undefined = yield select(
      (state) => state.dashboard.selectedDeviceFamily,
    );

    const requestPayload: {
      deviceId?: string;
      deviceFamily?: string;
      day?: string;
    } = {
      deviceId: action.payload,
    };

    if (selectedDeviceFamily && selectedDeviceFamily !== 'all') {
      requestPayload.deviceFamily = selectedDeviceFamily;
    }

    if (selectedDate) {
      requestPayload.day = selectedDate.format('YYYY-MM-DD');
    }

    yield put(fetchDeviceUsageAnalyticsDailyRequest(requestPayload));
  }
}

function* handleDateChange(action: PayloadAction<Dayjs | null>) {
  if (!isEmpty(action.payload) && action.payload) {
    const selectedDevice: string | undefined =
      yield select(selectSelectedDevice);
    const selectedDeviceFamily: string | undefined = yield select(
      selectSelectedDeviceFamily,
    );

    const requestPayload: {
      day: string;
      deviceId?: string;
      deviceFamily?: string;
    } = {
      day: action.payload.format('YYYY-MM-DD'),
    };

    if (selectedDevice) {
      requestPayload.deviceId = selectedDevice;
    }

    if (selectedDeviceFamily && selectedDeviceFamily !== 'all') {
      requestPayload.deviceFamily = selectedDeviceFamily;
    }

    yield put(fetchDeviceUsageAnalyticsDailyRequest(requestPayload));
  }
}

function* fetchDeviceFamiliesSaga() {
  try {
    const response: DeviceStateDetailedAnalytics = yield call(
      fetchDeviceStateDetailedAnalytics,
    );
    const mappedFamilies: DeviceFamilyItem[] = Object.entries(response).map(
      ([generation, devices]) => ({
        generation,
        deviceCount: devices.length,
        devices: devices.map((device) => ({
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          state: device.state,
        })),
      }),
    );
    yield put(fetchDeviceByFamiliesSuccess(mappedFamilies as never));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceByFamiliesFailure(
          error.message || 'Failed to fetch device families',
        ),
      );
    } else {
      yield put(
        fetchDeviceByFamiliesFailure('Failed to fetch device families'),
      );
    }
  }
}

function* fetchBuildsPerformanceSaga() {
  try {
    const response: BuildPerformanceData[] = yield call(fetchBuildsPerformance);
    yield put(fetchBuildsPerformanceSuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildsPerformanceFailure(
          error.message || 'Failed to fetch builds performance',
        ),
      );
    } else {
      yield put(
        fetchBuildsPerformanceFailure('Failed to fetch builds performance'),
      );
    }
  }
}

function* fetchBuildPerformanceByIdSaga(action: PayloadAction<string>) {
  try {
    const buildId = action.payload;
    const response: BuildPerformanceData = yield call(
      fetchBuildPerformanceById,
      buildId,
    );
    yield put(fetchBuildPerformanceByIdSuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildPerformanceByIdFailure(
          error.message || 'Failed to fetch build performance',
        ),
      );
    } else {
      yield put(
        fetchBuildPerformanceByIdFailure('Failed to fetch build performance'),
      );
    }
  }
}

function* fetchBuildExecutionsSaga(
  action: PayloadAction<{
    buildId: string;
    limit?: number;
    offset?: number;
    append?: boolean;
  }>,
) {
  try {
    const { buildId, limit = 5, offset = 0, append = false } = action.payload;
    const response: TestExecutionsByBuildResponse = yield call(
      fetchTestExecutionByBuild,
      buildId,
      {
        limit,
        offset,
      },
    );
    yield put(
      fetchBuildExecutionsSuccess({
        executions: response.executions ?? [],
        total: response.total ?? 0,
        limit: response.limit ?? limit,
        offset: response.offset ?? offset,
        append,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildExecutionsFailure(
          error.message || 'Failed to fetch build test executions',
        ),
      );
    } else {
      yield put(
        fetchBuildExecutionsFailure('Failed to fetch build test executions'),
      );
    }
  }
}

const mapExecutionResponseToBuildExecution = (
  execution: TestExecutionResponse,
): TestExecutionByBuild => {
  const groupedCases = execution.testCases ?? {};
  const flattenedCases = Object.values(groupedCases).flat();

  const mappedCases: TestCaseByBuild[] = flattenedCases.map((testCase) => {
    const testCaseWithOptionalId = testCase as typeof testCase & {
      id?: number;
    };

    return {
      id: testCaseWithOptionalId.id ?? testCase.testCaseId,
      testCaseId: testCase.testCaseId,
      suiteId: testCase.suiteId,
      suiteName: testCase.suiteName,
      title: testCase.title,
      result: testCase.result,
      updatedAt: testCase.updatedAt,
    };
  });

  return {
    id: execution.id,
    testId: execution.testId,
    buildId: execution.buildId,
    testPlanName: execution.testPlanName,
    status: execution.status,
    testCases: mappedCases,
  };
};

function* fetchBuildExecutionTestCaseByIdSaga(
  action: PayloadAction<{ testId: string; testCaseId: number }>,
) {
  try {
    const { testId, testCaseId } = action.payload;
    const response: TestCaseEntryForLogs = yield call(
      getSingleTestCase,
      testCaseId,
    );

    const mappedCase: TestCaseByBuild = {
      id: response.id,
      testCaseId: response.testCaseId,
      suiteId: response.suiteId,
      suiteName: response.suiteName,
      title: response.title,
      result: response.result,
      updatedAt: response.updatedAt,
    };

    yield put(
      fetchBuildExecutionTestCaseByIdSuccess({
        testId,
        testCase: mappedCase,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildExecutionTestCaseByIdFailure(
          error.message || 'Failed to fetch test case details',
        ),
      );
    } else {
      yield put(
        fetchBuildExecutionTestCaseByIdFailure(
          'Failed to fetch test case details',
        ),
      );
    }
  }
}

function* fetchBuildExecutionByTestIdSaga(
  action: PayloadAction<{ buildId: string; testId: string }>,
) {
  try {
    const { buildId, testId } = action.payload;
    const response: TestExecutionResponse = yield call(
      getSingleTestExecution,
      testId,
    );

    if (response.buildId !== buildId) {
      return;
    }

    yield put(
      fetchBuildExecutionByTestIdSuccess(
        mapExecutionResponseToBuildExecution(response),
      ),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildExecutionByTestIdFailure(
          error.message || 'Failed to fetch test execution details',
        ),
      );
    } else {
      yield put(
        fetchBuildExecutionByTestIdFailure(
          'Failed to fetch test execution details',
        ),
      );
    }
  }
}

export function* watchDashboard() {
  yield takeLatest(
    fetchDeviceStateAnalyticsRequest.type,
    fetchDeviceStateAnalyticsSaga,
  );
  yield takeLatest(
    fetchDeviceUsageAnalyticsDailyRequest.type,
    handleDeviceUsageDaily,
  );
  yield takeLatest(
    fetchDeviceUsageAnalyticsSummaryRequest.type,
    handleDeviceUsageSummary,
  );
  yield takeLatest(setSelectedDeviceFamily.type, handleDeviceFamilyChange);
  yield takeLatest(setSelectedDevice.type, handleDeviceChange);
  yield takeLatest(setSelectedDate.type, handleDateChange);
  yield takeLatest(fetchDeviceByFamiliesRequest.type, fetchDeviceFamiliesSaga);
  yield takeLatest(
    fetchBuildsPerformanceRequest.type,
    fetchBuildsPerformanceSaga,
  );
  yield takeEvery(
    fetchBuildPerformanceByIdRequest.type,
    fetchBuildPerformanceByIdSaga,
  );
  yield takeLatest(fetchBuildExecutionsRequest.type, fetchBuildExecutionsSaga);
  yield takeEvery(
    fetchBuildExecutionTestCaseByIdRequest.type,
    fetchBuildExecutionTestCaseByIdSaga,
  );
  yield takeEvery(
    fetchBuildExecutionByTestIdRequest.type,
    fetchBuildExecutionByTestIdSaga,
  );
}

export default watchDashboard;
