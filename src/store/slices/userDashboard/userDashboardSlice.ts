import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DashboardTableRow } from 'components/UserDashboard/shared/testExecutionData';
import type { TestSuiteCase } from 'components/UserDashboard/shared/TestSuiteDrawer';
import type {
  UserBuildComparisonData,
  TestExecutionActivity,
  ExecutionDailySummary,
} from 'typesCustom/analytics';

export type ExecutionReportStatus =
  | 'idle'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'uploading'
  | 'uploaded';

export interface ExecutionReportInfo {
  status: ExecutionReportStatus;
  error: string | null;
  uploadError: string | null;
}

export interface UserDashboardState {
  executions: DashboardTableRow[];
  activities: TestExecutionActivity[];
  buildsComparison: UserBuildComparisonData[];
  executionDailySummary: ExecutionDailySummary[];
  trendFrom: string | null;
  trendTo: string | null;
  loading: boolean;
  logDownloadLoading: boolean;
  testCasesByExecutionId: Record<string, TestSuiteCase[]>;
  testCasesLoadingByExecutionId: Record<string, boolean>;
  testCasesErrorByExecutionId: Record<string, string | null>;
  reportByTestId: Record<string, ExecutionReportInfo>;
  error: string | null;
  dataFetched: boolean;
}

const initialState: UserDashboardState = {
  executions: [],
  activities: [],
  buildsComparison: [],
  executionDailySummary: [],
  trendFrom: null,
  trendTo: null,
  loading: false,
  logDownloadLoading: false,
  testCasesByExecutionId: {},
  testCasesLoadingByExecutionId: {},
  testCasesErrorByExecutionId: {},
  reportByTestId: {},
  error: null,
  dataFetched: false,
};

const userDashboardSlice = createSlice({
  name: 'userDashboard',
  initialState,
  reducers: {
    fetchUserDashboardDataRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserDashboardDataSuccess(
      state,
      action: PayloadAction<{
        executions: DashboardTableRow[];
        activities: TestExecutionActivity[];
        buildsComparison: UserBuildComparisonData[];
      }>,
    ) {
      state.loading = false;
      state.dataFetched = true;
      state.executions = action.payload.executions;
      state.activities = action.payload.activities;
      state.buildsComparison = action.payload.buildsComparison;
    },
    fetchUserDashboardDataFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchUserDashboardExecutionRequest(
      state,
      _action: PayloadAction<{ testId: string }>,
    ) {
      state.error = null;
    },
    fetchUserDashboardExecutionSuccess(
      state,
      action: PayloadAction<{ execution: DashboardTableRow }>,
    ) {
      const { execution } = action.payload;
      const existingIndex = state.executions.findIndex(
        (item) => item.testId === execution.testId,
      );

      if (existingIndex >= 0) {
        state.executions[existingIndex] = execution;
      } else {
        state.executions.unshift(execution);
      }

      state.executions.sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return rightTime - leftTime;
      });
      state.dataFetched = true;
    },
    fetchUserDashboardExecutionFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    fetchUserDashboardActivityByTestIdRequest(
      state,
      _action: PayloadAction<{ testId: string }>,
    ) {
      state.error = null;
    },
    fetchUserDashboardActivityByTestIdSuccess(
      state,
      action: PayloadAction<{ activity: TestExecutionActivity }>,
    ) {
      const { activity } = action.payload;
      const existingIndex = state.activities.findIndex(
        (item) => item.testId === activity.testId,
      );

      if (existingIndex >= 0) {
        state.activities[existingIndex] = activity;
      } else {
        state.activities.unshift(activity);
      }

      state.activities.sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return rightTime - leftTime;
      });

      if (state.activities.length > 3) {
        state.activities = state.activities.slice(0, 3);
      }
    },
    fetchUserDashboardActivityByTestIdFailure(
      state,
      action: PayloadAction<string>,
    ) {
      state.error = action.payload;
    },
    fetchUserDashboardBuildPerformanceByIdRequest(
      state,
      _action: PayloadAction<{ buildId: string }>,
    ) {
      state.error = null;
    },
    fetchUserDashboardBuildPerformanceByIdSuccess(
      state,
      action: PayloadAction<{ buildPerformance: UserBuildComparisonData }>,
    ) {
      const incoming = action.payload.buildPerformance;
      const existingIndex = state.buildsComparison.findIndex(
        (build) => build.buildId === incoming.buildId,
      );

      if (existingIndex >= 0) {
        state.buildsComparison[existingIndex] = incoming;
      }
    },
    fetchUserDashboardBuildPerformanceByIdFailure(
      state,
      action: PayloadAction<string>,
    ) {
      state.error = action.payload;
    },
    removeUserDashboardBuildComparison(state, action: PayloadAction<string>) {
      state.buildsComparison = state.buildsComparison.filter(
        (build) => build.buildId !== action.payload,
      );
    },
    downloadUserDashboardExecutionLogRequest(
      state,
      _action: PayloadAction<{ testId: string }>,
    ) {
      state.logDownloadLoading = true;
      state.error = null;
    },
    downloadUserDashboardExecutionLogSuccess(state) {
      state.logDownloadLoading = false;
    },
    downloadUserDashboardExecutionLogFailure(
      state,
      action: PayloadAction<string>,
    ) {
      state.logDownloadLoading = false;
      state.error = action.payload;
    },
    fetchUserDashboardTestCasesByExecutionIdRequest(
      state,
      action: PayloadAction<{
        executionId: string;
        force?: boolean;
        background?: boolean;
      }>,
    ) {
      const { executionId, force = false, background = false } = action.payload;
      const alreadyLoaded = Object.prototype.hasOwnProperty.call(
        state.testCasesByExecutionId,
        executionId,
      );

      if (alreadyLoaded && !force) {
        return;
      }

      if (!background || !alreadyLoaded) {
        state.testCasesLoadingByExecutionId[executionId] = true;
      }
      state.testCasesErrorByExecutionId[executionId] = null;
    },
    fetchUserDashboardTestCasesByExecutionIdSuccess(
      state,
      action: PayloadAction<{ executionId: string; cases: TestSuiteCase[] }>,
    ) {
      const { executionId, cases } = action.payload;
      state.testCasesByExecutionId[executionId] = cases;
      state.testCasesLoadingByExecutionId[executionId] = false;
      state.testCasesErrorByExecutionId[executionId] = null;
    },
    fetchUserDashboardTestCasesByExecutionIdFailure(
      state,
      action: PayloadAction<{ executionId: string; error: string }>,
    ) {
      const { executionId, error } = action.payload;
      state.testCasesLoadingByExecutionId[executionId] = false;
      state.testCasesErrorByExecutionId[executionId] = error;
    },
    generateExecutionReportRequest(
      state,
      action: PayloadAction<{ testId: string }>,
    ) {
      state.reportByTestId[action.payload.testId] = {
        status: 'generating',
        error: null,
        uploadError: null,
      };
    },
    generateExecutionReportSuccess(
      state,
      action: PayloadAction<{
        testId: string;
        reportStatus: ExecutionReportStatus;
      }>,
    ) {
      state.reportByTestId[action.payload.testId] = {
        status: action.payload.reportStatus,
        error: null,
        uploadError: null,
      };
    },
    generateExecutionReportFailure(
      state,
      action: PayloadAction<{ testId: string; error: string }>,
    ) {
      state.reportByTestId[action.payload.testId] = {
        status: 'failed',
        error: action.payload.error,
        uploadError: null,
      };
    },
    fetchExecutionReportStatusRequest(
      _state,
      _action: PayloadAction<{ testId: string }>,
    ) {
      // handled by saga — no loading state needed; updates via success/failure
    },
    fetchExecutionReportStatusSuccess(
      state,
      action: PayloadAction<{
        testId: string;
        reportStatus: ExecutionReportStatus;
        uploadError?: string | null;
      }>,
    ) {
      const existing = state.reportByTestId[action.payload.testId];
      state.reportByTestId[action.payload.testId] = {
        status: action.payload.reportStatus,
        error: existing?.error ?? null,
        uploadError: action.payload.uploadError ?? null,
      };
    },
    uploadExecutionReportRequest(
      state,
      action: PayloadAction<{ testId: string }>,
    ) {
      if (state.reportByTestId[action.payload.testId]) {
        state.reportByTestId[action.payload.testId].status = 'uploading';
        state.reportByTestId[action.payload.testId].uploadError = null;
      }
    },
    uploadExecutionReportSuccess(
      state,
      action: PayloadAction<{ testId: string }>,
    ) {
      // Backend accepted the upload (202). Keep status as 'uploading' —
      // the actual 'uploaded' status arrives via WebSocket when the upload finishes.
      if (state.reportByTestId[action.payload.testId]) {
        state.reportByTestId[action.payload.testId].status = 'uploading';
        state.reportByTestId[action.payload.testId].uploadError = null;
      }
    },
    uploadExecutionReportFailure(
      state,
      action: PayloadAction<{ testId: string; error: string }>,
    ) {
      if (state.reportByTestId[action.payload.testId]) {
        // Keep status as 'completed' — the report was generated, only the upload failed.
        // uploadError drives the retry UI; it does NOT clobber the generation error box.
        state.reportByTestId[action.payload.testId].status = 'completed';
        state.reportByTestId[action.payload.testId].uploadError =
          action.payload.error;
      }
    },
    patchUserDashboardExecutionStatus(
      state,
      action: PayloadAction<{
        testId: string;
        status: DashboardTableRow['status'];
      }>,
    ) {
      const execution = state.executions.find(
        (item) => item.testId === action.payload.testId,
      );
      if (execution) {
        execution.status = action.payload.status;
      }
    },
    patchUserDashboardExecutionRtosLogPath(
      state,
      action: PayloadAction<{ testId: string; rtosLogPath: string }>,
    ) {
      const execution = state.executions.find(
        (item) => item.testId === action.payload.testId,
      );
      if (execution) {
        execution.rtosLogPath = action.payload.rtosLogPath;
      }
    },
    fetchUserDashboardExecutionDailySummaryRequest(
      state,
      action: PayloadAction<{ from: string; to: string }>,
    ) {
      state.error = null;
      state.trendFrom = action.payload.from;
      state.trendTo = action.payload.to;
    },
    fetchUserDashboardExecutionDailySummarySuccess(
      state,
      action: PayloadAction<{ summary: ExecutionDailySummary[] }>,
    ) {
      state.executionDailySummary = action.payload.summary;
    },
    fetchUserDashboardExecutionDailySummaryFailure(
      _state,
      _action: PayloadAction<string>,
    ) {
      // silently fail — chart falls back to execution-list data
    },
    refreshUserDashboardDailySummaryRequest(_state) {
      // handled by saga — triggers a re-fetch only when today is within trendFrom..trendTo
    },
    resetUserDashboardState: () => initialState,
    wsReportStatusUpdate(
      state,
      action: PayloadAction<{
        testExecutionId: string;
        status: ExecutionReportStatus;
        error?: string | null;
        uploadError?: string | null;
      }>,
    ) {
      const { testExecutionId, status, error, uploadError } = action.payload;
      const existing = state.reportByTestId[testExecutionId];
      state.reportByTestId[testExecutionId] = {
        status,
        error: error ?? null,
        uploadError: uploadError ?? existing?.uploadError ?? null,
      };
    },
    clearExecutionReportUploadError(
      state,
      action: PayloadAction<{ testId: string }>,
    ) {
      const entry = state.reportByTestId[action.payload.testId];
      if (entry) {
        entry.uploadError = null;
      }
    },
  },
});

export const {
  fetchUserDashboardDataRequest,
  fetchUserDashboardDataSuccess,
  fetchUserDashboardDataFailure,
  fetchUserDashboardExecutionRequest,
  fetchUserDashboardExecutionSuccess,
  fetchUserDashboardExecutionFailure,
  fetchUserDashboardActivityByTestIdRequest,
  fetchUserDashboardActivityByTestIdSuccess,
  fetchUserDashboardActivityByTestIdFailure,
  fetchUserDashboardBuildPerformanceByIdRequest,
  fetchUserDashboardBuildPerformanceByIdSuccess,
  fetchUserDashboardBuildPerformanceByIdFailure,
  removeUserDashboardBuildComparison,
  fetchUserDashboardExecutionDailySummaryRequest,
  fetchUserDashboardExecutionDailySummarySuccess,
  fetchUserDashboardExecutionDailySummaryFailure,
  refreshUserDashboardDailySummaryRequest,
  downloadUserDashboardExecutionLogRequest,
  downloadUserDashboardExecutionLogSuccess,
  downloadUserDashboardExecutionLogFailure,
  fetchUserDashboardTestCasesByExecutionIdRequest,
  fetchUserDashboardTestCasesByExecutionIdSuccess,
  fetchUserDashboardTestCasesByExecutionIdFailure,
  patchUserDashboardExecutionStatus,
  patchUserDashboardExecutionRtosLogPath,
  generateExecutionReportRequest,
  generateExecutionReportSuccess,
  generateExecutionReportFailure,
  fetchExecutionReportStatusRequest,
  fetchExecutionReportStatusSuccess,
  uploadExecutionReportRequest,
  uploadExecutionReportSuccess,
  uploadExecutionReportFailure,
  wsReportStatusUpdate,
  clearExecutionReportUploadError,
  resetUserDashboardState,
} = userDashboardSlice.actions;

export default userDashboardSlice.reducer;
