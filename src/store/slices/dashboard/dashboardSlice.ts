import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DASHBOARD_TABLE_COLUMN } from 'constants/dashboard';
import { DeviceResponse } from 'store/types/sagaTypes';
import {
  BuildPerformanceData,
  DeviceStateAnalytics,
  DeviceUsageAnalyticsDaily,
  DeviceUsageAnalyticsQuery,
  DeviceUsageAnalyticsSummary,
} from 'types/analytics';
import { IDevice } from 'typesCustom/types';
import { Dayjs } from 'dayjs';
import { RootState } from 'store/store';
import { DeviceFamilyItem } from 'components/Dashboard/AdminDashboard/types';
import { TestCaseByBuild, TestExecutionByBuild } from 'typesCustom/tests';
import { TestStatus } from 'types/tests';

interface DashboardTableColumn {
  name: string;
  label: string;
  visible: boolean;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  subLabel?: string;
}

interface DashboardState {
  loading?: boolean;
  error?: string | null;
  columns?: DashboardTableColumn[];
  deviceState?: DeviceStateAnalytics;
  deviceUsageDaily: DeviceUsageAnalyticsDaily | null;
  deviceUsageSummary: DeviceUsageAnalyticsSummary | null;
  selectedDeviceFamily: string | null;
  selectedDevice: string | null;
  selectedDate?: Dayjs | null;
  deviceInFamilyList: IDevice[];
  deviceFamilies: DeviceFamilyItem[];
  deviceFamiliesLoading: boolean;
  deviceFamiliesError: string | null;
  buildsPerformance: BuildPerformanceData[];
  buildsPerformanceLoading: boolean;
  buildsPerformanceError: string | null;
  buildExecutions: TestExecutionByBuild[];
  buildExecutionsLoading: boolean;
  buildExecutionsError: string | null;
  buildExecutionsTotal: number;
  buildExecutionsHasMore: boolean;
}

interface FetchBuildExecutionsRequestPayload {
  buildId: string;
  limit?: number;
  offset?: number;
  append?: boolean;
}

interface FetchBuildExecutionsSuccessPayload {
  executions: TestExecutionByBuild[];
  total: number;
  limit: number;
  offset: number;
  append: boolean;
}

interface FetchBuildExecutionTestCaseByIdRequestPayload {
  testId: string;
  testCaseId: number;
}

interface FetchBuildExecutionTestCaseByIdSuccessPayload {
  testId: string;
  testCase: TestCaseByBuild;
}

interface FetchBuildExecutionByTestIdRequestPayload {
  buildId: string;
  testId: string;
}

interface UpdateBuildExecutionStatusPayload {
  testId: string;
  status: TestStatus;
}

const sortTestCasesAscById = (testCases: TestCaseByBuild[]) => {
  testCases.sort((left, right) => {
    const leftId = left.id ?? 0;
    const rightId = right.id ?? 0;
    return leftId - rightId;
  });
};

const findTestCaseIndex = (
  testCases: TestCaseByBuild[],
  incoming: TestCaseByBuild,
) => {
  const byTestCaseId = testCases.findIndex(
    (item) => item.testCaseId === incoming.testCaseId,
  );

  if (byTestCaseId !== -1) {
    return byTestCaseId;
  }

  return testCases.findIndex((item) => item.id === incoming.id);
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  columns: DASHBOARD_TABLE_COLUMN,
  deviceState: {
    total: 0,
    stateCount: new Map(),
  },
  deviceUsageDaily: null,
  deviceUsageSummary: null,
  selectedDeviceFamily: '',
  selectedDevice: '',
  selectedDate: null,
  deviceInFamilyList: [],
  deviceFamilies: [],
  deviceFamiliesLoading: false,
  deviceFamiliesError: null,
  buildsPerformance: [],
  buildsPerformanceLoading: false,
  buildsPerformanceError: null,
  buildExecutions: [],
  buildExecutionsLoading: false,
  buildExecutionsError: null,
  buildExecutionsTotal: 0,
  buildExecutionsHasMore: true,
};

const deviceSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedDevice: (state, action: PayloadAction<string>) => {
      state.selectedDevice = action.payload;
    },
    setSelectedDeviceFamily: (state, action: PayloadAction<string>) => {
      if (action.payload === 'all') {
        state.selectedDeviceFamily = action.payload;
        state.selectedDevice = '';
      } else {
        state.selectedDeviceFamily = action.payload;
        state.selectedDevice = '';
      }
    },
    setSelectedDate(state, action: PayloadAction<Dayjs | null>) {
      state.selectedDate = action.payload;
    },
    fetchDevicesInFamilySuccess: (
      state,
      action: PayloadAction<DeviceResponse>,
    ) => {
      state.loading = false;
      state.deviceInFamilyList = action.payload.data;
      if (state.deviceUsageDaily) {
        state.deviceUsageDaily.totalDevices = action.payload.totalDevices;
      }
    },
    setDashboardColumns: (
      state,
      action: PayloadAction<DashboardTableColumn[]>,
    ) => {
      state.columns = action.payload;
    },
    fetchDeviceStateAnalyticsRequest: (state) => {
      state.loading = true;
    },
    fetchDeviceStateAnalyticsSuccess: (
      state,
      action: PayloadAction<DeviceStateAnalytics>,
    ) => {
      state.loading = false;
      state.deviceState = action.payload;
    },
    fetchDeviceStateAnalyticsFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchDeviceUsageAnalyticsDailyRequest: (
      state,
      _action: PayloadAction<DeviceUsageAnalyticsQuery>,
    ) => {
      state.loading = true;
    },
    fetchDeviceUsageAnalyticsDailySuccess: (
      state,
      action: PayloadAction<DeviceUsageAnalyticsDaily>,
    ) => {
      state.deviceUsageDaily = action.payload;
      state.loading = false;
      state.error = '';
    },
    fetchDeviceUsageAnalyticsDailyFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchDeviceUsageAnalyticsSummaryRequest: (state) => {
      state.loading = true;
    },
    fetchDeviceUsageAnalyticsSummarySuccess: (
      state,
      action: PayloadAction<DeviceUsageAnalyticsSummary>,
    ) => {
      state.deviceUsageSummary = action.payload;
      state.loading = false;
      state.error = '';
    },
    fetchDeviceUsageAnalyticsSummaryFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchDeviceByFamiliesRequest: (state) => {
      state.deviceFamiliesLoading = true;
      state.deviceFamiliesError = null;
    },
    fetchDeviceByFamiliesSuccess: (
      state,
      action: PayloadAction<DeviceFamilyItem[]>,
    ) => {
      state.deviceFamilies = action.payload;
      state.deviceFamiliesLoading = false;
      state.deviceFamiliesError = null;
    },
    fetchDeviceByFamiliesFailure: (state, action: PayloadAction<string>) => {
      state.deviceFamiliesLoading = false;
      state.deviceFamiliesError = action.payload;
    },
    fetchBuildsPerformanceRequest: (state) => {
      state.buildsPerformanceLoading = true;
      state.buildsPerformanceError = null;
    },
    fetchBuildsPerformanceSuccess: (
      state,
      action: PayloadAction<BuildPerformanceData[]>,
    ) => {
      state.buildsPerformance = action.payload;
      state.buildsPerformanceLoading = false;
      state.buildsPerformanceError = null;
    },
    fetchBuildsPerformanceFailure: (state, action: PayloadAction<string>) => {
      state.buildsPerformanceLoading = false;
      state.buildsPerformanceError = action.payload;
    },
    updateBuildPerformanceSuccess: (
      state,
      action: PayloadAction<BuildPerformanceData>,
    ) => {
      const index = state.buildsPerformance.findIndex(
        (build) => build.buildId === action.payload.buildId,
      );
      if (index !== -1) {
        state.buildsPerformance[index] = action.payload;
      }
    },
    fetchBuildPerformanceByIdRequest: (
      state,
      _action: PayloadAction<string>,
    ) => {
      state.buildsPerformanceLoading = true;
      state.buildsPerformanceError = null;
    },
    fetchBuildPerformanceByIdSuccess: (
      state,
      action: PayloadAction<BuildPerformanceData>,
    ) => {
      state.buildsPerformanceLoading = false;
      state.buildsPerformanceError = null;
      const index = state.buildsPerformance.findIndex(
        (build) => build.buildId === action.payload.buildId,
      );
      if (index !== -1) {
        state.buildsPerformance[index] = action.payload;
      }
    },
    fetchBuildPerformanceByIdFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.buildsPerformanceLoading = false;
      state.buildsPerformanceError = action.payload;
    },
    removeBuildPerformance: (state, action: PayloadAction<string>) => {
      state.buildsPerformance = state.buildsPerformance.filter(
        (build) => build.buildId !== action.payload,
      );
    },
    fetchBuildExecutionsRequest: (
      state,
      action: PayloadAction<FetchBuildExecutionsRequestPayload>,
    ) => {
      const { append, offset = 0 } = action.payload;
      state.buildExecutionsLoading = true;
      state.buildExecutionsError = null;

      // Keep existing rows during websocket-driven refreshes to avoid UI flicker.
      // The list is explicitly cleared by clearBuildExecutions on build change.
      if (!append && offset === 0 && state.buildExecutions.length === 0) {
        state.buildExecutions = [];
        state.buildExecutionsTotal = 0;
        state.buildExecutionsHasMore = true;
      }
    },
    fetchBuildExecutionsSuccess: (
      state,
      action: PayloadAction<FetchBuildExecutionsSuccessPayload>,
    ) => {
      const { executions, total, offset, append } = action.payload;
      state.buildExecutions = append
        ? [...state.buildExecutions, ...executions]
        : executions;
      state.buildExecutionsTotal = total;
      state.buildExecutionsHasMore = offset + executions.length < total;
      state.buildExecutionsLoading = false;
      state.buildExecutionsError = null;
    },
    fetchBuildExecutionsFailure: (state, action: PayloadAction<string>) => {
      state.buildExecutionsLoading = false;
      state.buildExecutionsError = action.payload;
    },
    fetchBuildExecutionTestCaseByIdRequest: (
      state,
      _action: PayloadAction<FetchBuildExecutionTestCaseByIdRequestPayload>,
    ) => {
      state.buildExecutionsError = null;
    },
    fetchBuildExecutionTestCaseByIdSuccess: (
      state,
      action: PayloadAction<FetchBuildExecutionTestCaseByIdSuccessPayload>,
    ) => {
      const { testId, testCase } = action.payload;
      const executionIndex = state.buildExecutions.findIndex(
        (execution) => execution.testId === testId,
      );

      if (executionIndex === -1) {
        return;
      }

      const currentExecution = state.buildExecutions[executionIndex];
      const existingCaseIndex = findTestCaseIndex(
        currentExecution.testCases,
        testCase,
      );

      if (existingCaseIndex !== -1) {
        currentExecution.testCases[existingCaseIndex] = {
          ...currentExecution.testCases[existingCaseIndex],
          ...testCase,
        };
        sortTestCasesAscById(currentExecution.testCases);
        return;
      }

      currentExecution.testCases = [...currentExecution.testCases, testCase];
      sortTestCasesAscById(currentExecution.testCases);
    },
    fetchBuildExecutionTestCaseByIdFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.buildExecutionsError = action.payload;
    },
    fetchBuildExecutionByTestIdRequest: (
      state,
      _action: PayloadAction<FetchBuildExecutionByTestIdRequestPayload>,
    ) => {
      state.buildExecutionsError = null;
    },
    fetchBuildExecutionByTestIdSuccess: (
      state,
      action: PayloadAction<TestExecutionByBuild>,
    ) => {
      const incoming = {
        ...action.payload,
        testCases: [...(action.payload.testCases ?? [])],
      };
      sortTestCasesAscById(incoming.testCases);

      const existingIndex = state.buildExecutions.findIndex(
        (execution) => execution.testId === incoming.testId,
      );

      if (existingIndex !== -1) {
        state.buildExecutions[existingIndex] = incoming;
        return;
      }

      state.buildExecutions = [incoming, ...state.buildExecutions];
      state.buildExecutionsTotal += 1;
    },
    fetchBuildExecutionByTestIdFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.buildExecutionsError = action.payload;
    },
    updateBuildExecutionStatus: (
      state,
      action: PayloadAction<UpdateBuildExecutionStatusPayload>,
    ) => {
      const { testId, status } = action.payload;
      const executionIndex = state.buildExecutions.findIndex(
        (execution) => execution.testId === testId,
      );

      if (executionIndex === -1) {
        return;
      }

      state.buildExecutions[executionIndex].status = status;
    },
    clearBuildExecutions: (state) => {
      state.buildExecutions = [];
      state.buildExecutionsLoading = false;
      state.buildExecutionsError = null;
      state.buildExecutionsTotal = 0;
      state.buildExecutionsHasMore = true;
    },
  },
});

export const {
  setDashboardColumns,
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
  setSelectedDevice,
  setSelectedDate,
  fetchDevicesInFamilySuccess,
  fetchDeviceByFamiliesRequest,
  fetchDeviceByFamiliesSuccess,
  fetchDeviceByFamiliesFailure,
  fetchBuildsPerformanceRequest,
  fetchBuildsPerformanceSuccess,
  fetchBuildsPerformanceFailure,
  updateBuildPerformanceSuccess,
  fetchBuildPerformanceByIdRequest,
  fetchBuildPerformanceByIdSuccess,
  fetchBuildPerformanceByIdFailure,
  removeBuildPerformance,
  fetchBuildExecutionsRequest,
  fetchBuildExecutionsSuccess,
  fetchBuildExecutionsFailure,
  fetchBuildExecutionTestCaseByIdRequest,
  fetchBuildExecutionTestCaseByIdSuccess,
  fetchBuildExecutionTestCaseByIdFailure,
  fetchBuildExecutionByTestIdRequest,
  fetchBuildExecutionByTestIdSuccess,
  fetchBuildExecutionByTestIdFailure,
  updateBuildExecutionStatus,
  clearBuildExecutions,
} = deviceSlice.actions;

export default deviceSlice.reducer;
export type { DashboardTableColumn };
export type { DashboardState };
export const selectSelectedDevice = (state: RootState): string | null =>
  state.dashboard.selectedDevice;

export const selectSelectedDeviceFamily = (state: RootState): string | null =>
  state.dashboard.selectedDeviceFamily;
