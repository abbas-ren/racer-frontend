import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { FetchDataQuery } from 'store/types/sagaTypes';
import {
  InProgressTestExecutionResponse,
  InProgressTestsList,
  TestCase,
  TestExecutionAnalyticsResponse,
  TestExecutionForTable,
  TestExecutionPayload,
  TestExecutionResponse,
  TestExecutionResultResponse,
  TestExecutionsForTableResponse,
  TestPlan,
  TestsPaginationState,
  TestPlanSummary,
  TestSuite,
  TestCaseEntry,
} from 'types/tests';
import {
  // initialPaginationState,
  // mergeUniqueById,
  setFailure,
  setLoading,
  setSuccess,
} from 'utils/test';

enableMapSet();

interface SelectedData {
  deviceFamily: string;
  deviceID: string;
  buildID: string;
  testPlan: number | null;
}

interface DownloadState {
  downloading: boolean;
  error: string | null;
}

interface ToggleSuitePayload {
  suiteId: number;
  selected: boolean;
}

interface ToggleTestCasePayload {
  testCaseId: number;
  suiteId: number;
  suiteName: string;
}

interface TestPlanSummaryWithStates extends TestPlanSummary {
  loading: boolean;
  error: string | null;
}

type SelectMode = 'all' | 'none';

interface SelectedInitialState {
  selectedData: SelectedData;
  currentTestPlan: TestPlan | null;
  selectedSuites: number[];
  selectedTestCases: Record<number, TestCaseEntry[]>;
  currentTestExecution: TestExecutionResponse | null;
  logs: Record<string, string[]>;
  selectedTestExecution: TestExecutionResponse | null;
  selectTestExecutionLoading: boolean;
  selectTestExecutionError: string;
  testExecutionID: string;
  selectMode: SelectMode;
  suiteSelectMode: Record<number, SelectMode>;
}

export interface TestsState extends SelectedInitialState {
  loading: boolean;
  testPlanLoading: boolean;
  testExecutionLoading: boolean;
  error: string;
  testExecutionError: string | null;
  testPlans: Record<string, TestsPaginationState<TestPlan>>;
  testSuites: Record<number, TestsPaginationState<TestSuite>>;
  testCases: Record<number, TestsPaginationState<TestCase>>;
  testCasesBySuiteId: Record<string, Record<number, TestCase[]>>;
  totalTestCases: number;
  testExecutions: TestExecutionsForTableResponse | null;
  analytics: TestExecutionAnalyticsResponse | null;
  analyticsLoading: boolean;
  analyticsError: string;
  inProgressTestExecutions: InProgressTestExecutionResponse[] | null;
  inProgressLoading: boolean;
  inProgressError: string;
  cancelled: {
    loading: boolean;
    error: string;
    status: boolean;
  };
  download: DownloadState;
  inProgressTestsList: InProgressTestsList[];
  testPlanSummary: TestPlanSummaryWithStates;
}

const selectedInitialState: SelectedInitialState = {
  selectedData: {
    deviceFamily: '',
    deviceID: '',
    buildID: '',
    testPlan: null,
  },
  selectedTestExecution: null,
  selectTestExecutionLoading: false,
  selectTestExecutionError: '',
  logs: {},
  selectedSuites: [],
  currentTestExecution: null,
  currentTestPlan: null,
  selectedTestCases: {},
  testExecutionID: '',
  selectMode: 'none',
  suiteSelectMode: {},
};

export const TestsInitialState: TestsState = {
  ...selectedInitialState,
  loading: false,
  testPlanLoading: false,
  testExecutionLoading: false,
  error: '',
  testExecutionError: null,
  currentTestExecution: null,
  testPlans: {},
  testSuites: {},
  testCases: {},
  currentTestPlan: null,
  testCasesBySuiteId: {},
  totalTestCases: 0,
  testExecutions: null,
  analytics: null,
  analyticsLoading: false,
  analyticsError: '',
  inProgressTestExecutions: null,
  inProgressLoading: false,
  inProgressError: '',
  cancelled: {
    loading: false,
    error: '',
    status: false,
  },
  inProgressTestsList: [],
  download: {
    downloading: false,
    error: null,
  },
  testPlanSummary: {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    cancelled: 0,
    error: '',
    loading: false,
  },
};

const testsSlice = createSlice({
  name: 'tests',
  initialState: TestsInitialState,
  reducers: {
    setDeviceFamily: (state, action: PayloadAction<string>) => {
      state.selectedData.deviceFamily = action.payload;
      state.selectedData.deviceID = '';
      state.selectedData.buildID = '';
      state.selectedData.testPlan = null;
      state.currentTestPlan = null;
      state.selectMode = 'none';
    },
    setDeviceID: (state, action: PayloadAction<string>) => {
      state.selectedData.deviceID = action.payload;
      state.selectedData.buildID = '';
      state.selectedData.testPlan = null;
      state.currentTestPlan = null;
      state.currentTestExecution = null;
      state.testExecutionID = '';
      state.selectMode = 'none';
      for (const key in state.suiteSelectMode) {
        state.suiteSelectMode[key] = 'none';
      }
      state.totalTestCases = 0;
    },
    setBuildIDFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setBuildID: (state, _action: PayloadAction<string>) => {
      state.loading = true;
      state.error = '';
    },
    setBuildIDSuccess: (state, action: PayloadAction<string>) => {
      state.selectedData.buildID = action.payload;
      state.selectedData.testPlan = null;
      state.currentTestPlan = null;
      state.currentTestExecution = null;
      state.testExecutionID = '';
      state.selectMode = 'none';
      for (const key in state.suiteSelectMode) {
        state.suiteSelectMode[key] = 'none';
      }
      state.totalTestCases = 0;
    },
    setTestPlan: (state, action: PayloadAction<number>) => {
      state.selectedData.testPlan = action.payload;
      state.currentTestPlan =
        state.testPlans[state.selectedData.buildID].items.find(
          (testPlan) => testPlan.id === action.payload,
        ) ?? null;
      state.selectedSuites = [];
      state.selectedTestCases = {};
      state.currentTestExecution = null;
      state.testExecutionID = '';
      state.selectMode = 'none';
      for (const key in state.suiteSelectMode) {
        state.suiteSelectMode[key] = 'none';
      }
      state.totalTestCases = 0;
    },
    fetchTestPlansRequest: (
      state,
      action: PayloadAction<{ buildId: string; deviceId: string }>,
    ) => {
      setLoading(state.testPlans, action.payload.buildId);
    },
    fetchTestPlansFailure: (
      state,
      action: PayloadAction<{ buildId: string; error: string }>,
    ) => {
      setFailure(state.testPlans, action.payload.buildId, action.payload.error);
    },
    fetchTestPlansSuccess: (
      state,
      action: PayloadAction<{
        buildId: string;
        items: TestPlan[];
      }>,
    ) => {
      setSuccess(state.testPlans, action.payload.buildId, action.payload.items);
    },
    fetchTestSuitesRequest: (
      state,
      action: PayloadAction<{ planId: number }>,
    ) => {
      setLoading(state.testSuites, action.payload.planId);
    },
    fetchTestSuitesFailure: (
      state,
      action: PayloadAction<{ planId: number; error: string }>,
    ) => {
      setFailure(state.testSuites, action.payload.planId, action.payload.error);
    },
    fetchTestSuitesSuccess: (
      state,
      action: PayloadAction<{
        planId: number;
        items: TestSuite[];
      }>,
    ) => {
      setSuccess(state.testSuites, action.payload.planId, action.payload.items);
    },
    fetchTestCasesRequest: (
      state,
      action: PayloadAction<{ suiteId: number }>,
    ) => {
      setLoading(state.testCases, action.payload.suiteId);
    },
    fetchTestCasesFailure: (
      state,
      action: PayloadAction<{ suiteId: number; error: string }>,
    ) => {
      setFailure(state.testCases, action.payload.suiteId, action.payload.error);
    },
    fetchTestCasesSuccess: (
      state,
      action: PayloadAction<{
        suiteId: number;
        items: TestCase[];
      }>,
    ) => {
      setSuccess(state.testCases, action.payload.suiteId, action.payload.items);
      state.totalTestCases =
        state.testCases[action.payload.suiteId].items.length;

      const testCases = state.testCases[action.payload.suiteId]?.items;
      const suite = state.testSuites[
        state.selectedData.testPlan || 0
      ]?.items.find((s) => s.id === action.payload.suiteId);
      if (
        suite &&
        testCases &&
        testCases.length > 0 &&
        (state.suiteSelectMode[action.payload.suiteId] === 'all' ||
          state.selectMode === 'all')
      ) {
        if (!state.selectedTestCases[suite.id]) {
          state.selectedTestCases[suite.id] = [];
        }
        state.selectedTestCases[suite.id] = testCases.map((tc) => ({
          ...tc,
          testCaseId: tc.id,
          suiteName: suite.name,
          updatedAt: '',
        }));
      }
    },
    fetchAllTestCasesRequest(state, _action: PayloadAction<number>) {
      state.testPlanLoading = true;
      state.error = '';
    },
    fetchAllTestCasesSuccess(
      state,
      action: PayloadAction<Record<string, TestCase[]> | null>,
    ) {
      if (action.payload) {
        if (state.selectedData.testPlan) {
          if (!state.testCasesBySuiteId[state.selectedData.testPlan]) {
            state.testCasesBySuiteId[state.selectedData.testPlan] = [];
          }
          state.testCasesBySuiteId[state.selectedData.testPlan] =
            action.payload;
          state.totalTestCases = Object.values(action.payload).flat().length;
        }
      }
      state.error = '';
      state.testPlanLoading = false;
    },
    fetchAllTestCasesFailure(state, action: PayloadAction<string>) {
      state.testPlanLoading = false;
      state.error = action.payload;
    },
    toggleSuite: (state, action: PayloadAction<ToggleSuitePayload>) => {
      const { suiteId, selected } = action.payload;
      state.currentTestExecution = null;
      state.testExecutionID = '';
      if (selected) {
        const exists = state.selectedSuites.some((sId) => sId === suiteId);
        if (!exists) {
          state.selectedSuites.push(suiteId);
        }
        state.suiteSelectMode[suiteId] = 'all';
      } else {
        state.selectedSuites = state.selectedSuites.filter(
          (sId) => sId !== suiteId,
        );
        state.suiteSelectMode[suiteId] = 'none';
        state.selectedTestCases[suiteId] = [];
      }

      state.selectMode = Object.values(state.suiteSelectMode).every(
        (mode) => mode === 'all',
      )
        ? 'all'
        : 'none';
    },
    toggleTestCase: (state, action: PayloadAction<ToggleTestCasePayload>) => {
      const { testCaseId, suiteId, suiteName } = action.payload;
      state.currentTestExecution = null;
      state.testExecutionID = '';
      if (!state.selectedTestCases[suiteId]) {
        state.selectedTestCases[suiteId] = [];
      }
      const isSuiteSelected = state.selectedSuites.some(
        (sId) => sId === suiteId,
      );

      if (isSuiteSelected) {
        state.selectedTestCases[suiteId] = state.testCases[suiteId]
          ? state.testCases[suiteId].items?.map((tc) => ({
              ...tc,
              testCaseId: tc.id,
              suiteName: suiteName,
              updatedAt: '',
            }))
          : [];
      }
      const exists = state.selectedTestCases[suiteId].some(
        (tc) => tc.testCaseId === testCaseId,
      );
      if (exists) {
        state.selectedTestCases[suiteId] = state.selectedTestCases[
          suiteId
        ].filter((tc) => tc.testCaseId !== testCaseId);
      } else {
        const tc = state.testCases[suiteId]?.items.find(
          (tc) => tc.id === testCaseId,
        );
        if (tc) {
          state.selectedTestCases[suiteId].push({
            ...tc,
            testCaseId: tc.id,
            suiteName: suiteName,
            updatedAt: '',
          });
        }
      }
      if (
        state.testCases[suiteId] &&
        state.testCases[suiteId].items.length ===
          state.selectedTestCases[suiteId].length
      ) {
        state.suiteSelectMode[suiteId] = 'all';
        if (!state.selectedSuites.some((sId) => sId === suiteId)) {
          state.selectedSuites.push(suiteId);
        }
      } else {
        state.suiteSelectMode[suiteId] = 'none';
        state.selectedSuites = state.selectedSuites.filter(
          (sId) => sId !== suiteId,
        );
      }
      state.selectMode = Object.values(state.suiteSelectMode).every(
        (v) => v === 'all',
      )
        ? 'all'
        : 'none';
    },
    toggleSelectAll: (state) => {
      state.selectMode = state.selectMode === 'all' ? 'none' : 'all';
      state.currentTestExecution = null;
      state.testExecutionID = '';
      if (state.selectMode === 'none') {
        state.selectedSuites = [];
        state.selectedTestCases = {};
        for (const key in state.suiteSelectMode) {
          state.suiteSelectMode[key] = 'none';
        }
      } else {
        const testSuites =
          state.testSuites[state.selectedData.testPlan || 0].items;

        if (testSuites && testSuites.length > 0) {
          state.selectedSuites = testSuites.map((suite) => suite.id);
          state.suiteSelectMode = testSuites.reduce(
            (acc, suite) => {
              acc[suite.id] = 'all';
              return acc;
            },
            {} as Record<number, SelectMode>,
          );
        }
      }
    },
    testExecutionRequest: (
      state,
      _action: PayloadAction<TestExecutionPayload>,
    ) => {
      state.testExecutionLoading = true;
      state.testExecutionError = '';
    },
    testExecutionSuccess: (
      state,
      action: PayloadAction<TestExecutionResponse>,
    ) => {
      state.testExecutionID = action.payload.testId;
      // state.selectedTestCases = action.payload.testCases;
      // state.selectedSuites = action.payload.testSuits;
      state.currentTestExecution = action.payload;
      if (!state.logs[action.payload.testId]) {
        state.logs[action.payload.testId] = [];
      }
      state.logs[action.payload.testId] = action.payload.logs;
      state.testExecutionLoading = false;
      state.loading = false;
      state.testExecutionError = '';
    },
    testExecutionFailure: (state, action: PayloadAction<string>) => {
      state.testExecutionError = action.payload;
      state.testExecutionLoading = false;
    },
    getTestExecutionRequest: (
      state,
      _action: PayloadAction<string | undefined>,
    ) => {
      state.testExecutionLoading = true;
      state.loading = true;
      state.error = '';
    },
    getTestExecutionSuccess: (
      state,
      action: PayloadAction<TestExecutionResponse>,
    ) => {
      state.currentTestExecution = action.payload;
      state.testExecutionLoading = false;
      state.loading = false;
      state.selectedData.buildID = action.payload.buildId;
      state.selectedData.deviceFamily = action.payload.deviceFamily;
      state.selectedData.deviceID = action.payload.deviceId;
      state.selectedData.testPlan = Number(action.payload.testPlanId);
      // state.selectedSuites = action.payload.testSuits;
      // state.selectedTestCases = action.payload.testCases;
      if (!state.logs[action.payload.testId]) {
        state.logs[action.payload.testId] = [];
      }
      state.logs[action.payload.testId] = action.payload.logs;
      state.currentTestPlan =
        state.testPlans[action.payload.buildId].items.find(
          (testPlan) => testPlan.id === Number(action.payload.testPlanId),
        ) ?? null;
    },
    getTestExecutionFailure: (state, action: PayloadAction<string>) => {
      state.testExecutionLoading = false;
      state.loading = false;
      state.cancelled = TestsInitialState.cancelled;
      state.testExecutionID = TestsInitialState.testExecutionID;
      state.currentTestExecution = TestsInitialState.currentTestExecution;
      state.error = action.payload;
    },
    getTestExecutionResultRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
    },
    getTestExecutionResultSuccess: (
      state,
      action: PayloadAction<TestExecutionResultResponse>,
    ) => {
      state.loading = false;
      state.error = '';
      // state.selectedTestCases = action.payload.testCases;
      if (state.currentTestExecution) {
        state.currentTestExecution.status = action.payload.status;
      }
    },
    getTestExecutionResultFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    getSingleTestExecutionResultRequest: (
      state,
      _action: PayloadAction<string>,
    ) => {
      state.loading = true;
    },
    getSingleTestExecutionResultSuccess: (
      state,
      action: PayloadAction<TestExecutionForTable>,
    ) => {
      state.loading = false;
      state.error = '';
      if (
        state.selectedTestExecution &&
        state.selectedTestExecution.testId === action.payload.testId
      ) {
        state.selectedTestExecution.testCases = action.payload.testCases;
      }

      if (action.payload.analytics) {
        if (state.analytics) {
          state.analytics.allTime = action.payload.analytics.allTime;
          if (
            Array.isArray(state.analytics.weekly) &&
            state.analytics.weekly.length > 5
          ) {
            state.analytics.weekly[5] = action.payload.analytics.currentWeek;
          }
          if (
            Array.isArray(state.analytics.monthly) &&
            state.analytics.monthly.length > 5
          ) {
            state.analytics.monthly[5] = action.payload.analytics.currentMonth;
          }
        }
      }

      if (state.testExecutions && Array.isArray(state.testExecutions.data)) {
        const idx = state.testExecutions.data.findIndex(
          (item) => item.testId === action.payload.testId,
        );
        if (idx !== -1) {
          state.testExecutions.data[idx] = action.payload;
        } else {
          state.testExecutions.data.unshift(action.payload);
        }
      }

      if (
        state.inProgressTestExecutions &&
        Array.isArray(state.inProgressTestExecutions)
      ) {
        const idx = state.inProgressTestExecutions.findIndex(
          (item) => item.id === action.payload.testId,
        );
        if (idx !== -1) {
          state.inProgressTestExecutions[idx] = {
            ...state.inProgressTestExecutions[idx],
            executed: action.payload.failed + action.payload.passed,
          };
          if (
            state.inProgressTestExecutions[idx].total ===
            action.payload.failed + action.payload.passed
          ) {
            state.inProgressTestExecutions.splice(idx, 1);
          }
        } else {
          state.inProgressTestExecutions.unshift({
            id: action.payload.testId,
            testPlanName: action.payload.testPlanName,
            total: action.payload.total,
            executed: action.payload.failed + action.payload.passed,
          });
        }
      }
    },
    getSingleTestExecutionResultFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.loading = false;
      state.error = action.payload;
    },

    fetchTestExecutionsRequest: (
      state,
      _action: PayloadAction<FetchDataQuery>,
    ) => {
      state.loading = true;
      state.error = '';
    },
    fetchTestExecutionsSuccess: (
      state,
      action: PayloadAction<TestExecutionsForTableResponse>,
    ) => {
      state.loading = false;
      state.error = '';

      if (state.testExecutions && action.payload.currentPage > 1) {
        const existingIds = new Set(
          state.testExecutions.data.map((item) => item.testId),
        );
        const newData = action.payload.data.filter(
          (item) => !existingIds.has(item.testId),
        );
        state.testExecutions = {
          ...action.payload,
          data: [...state.testExecutions.data, ...newData],
        };
      } else {
        state.testExecutions = action.payload;
      }
    },
    fetchTestExecutionsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    getSelectedTestExecutionRequest: (
      state,
      _action: PayloadAction<string>,
    ) => {
      state.selectTestExecutionLoading = true;
      state.selectTestExecutionError = '';
    },
    getSelectedTestExecutionSuccess: (
      state,
      action: PayloadAction<TestExecutionResponse>,
    ) => {
      state.selectTestExecutionLoading = false;
      state.selectTestExecutionError = '';
      state.selectedTestExecution = action.payload;
      if (!state.logs[action.payload.testId]) {
        state.logs[action.payload.testId] = [];
      }
      state.logs[action.payload.testId] = action.payload.logs;
    },
    getSelectedTestExecutionFailure: (state, action: PayloadAction<string>) => {
      state.selectTestExecutionLoading = false;
      state.selectTestExecutionError = action.payload;
    },
    fetchTestExecutionAnalyticsRequest: (state) => {
      state.analyticsLoading = true;
      state.analyticsError = '';
    },
    fetchTestExecutionAnalyticsSuccess: (
      state,
      action: PayloadAction<TestExecutionAnalyticsResponse>,
    ) => {
      state.analyticsLoading = false;
      state.analyticsError = '';
      state.analytics = action.payload;
    },
    fetchTestExecutionAnalyticsFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.analyticsLoading = false;
      state.analyticsError = action.payload;
    },

    getInProgressTestExecutionsRequest: (state) => {
      state.inProgressLoading = true;
      state.inProgressError = '';
    },
    getInProgressTestExecutionsSuccess: (
      state,
      action: PayloadAction<InProgressTestExecutionResponse[]>,
    ) => {
      state.inProgressLoading = false;
      state.inProgressError = '';
      state.inProgressTestExecutions = action.payload;
    },
    getInProgressTestExecutionsFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.inProgressLoading = false;
      state.inProgressError = action.payload;
    },
    cancelTestExecutionRequest: (state, _action: PayloadAction<string>) => {
      state.cancelled.loading = true;
      state.cancelled.error = '';
    },
    cancelTestExecutionSuccess: (
      state,
      action: PayloadAction<TestExecutionResponse>,
    ) => {
      state.cancelled.loading = false;
      state.cancelled.error = '';
      state.cancelled.status = true;
      state.currentTestExecution = action.payload;
      // state.selectedSuites = action.payload.testSuits;
      // state.selectedTestCases = action.payload.testCases;
    },
    cancelTestExecutionFailure: (state, action: PayloadAction<string>) => {
      state.cancelled.loading = false;
      state.cancelled.error = action.payload;
    },
    resetTestsFormData: (state) => {
      state.cancelled = TestsInitialState.cancelled;
      state.testExecutionID = TestsInitialState.testExecutionID;
      state.currentTestExecution = TestsInitialState.currentTestExecution;
    },
    fetchInProgressTestsListRequest: (state) => {
      state.loading = true;
    },
    fetchInProgressTestsListSuccess: (
      state,
      action: PayloadAction<InProgressTestsList[]>,
    ) => {
      state.inProgressTestsList = action.payload;
    },
    fetchInProgressTestsListFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchTestExecutionForDeviceRequest: (
      state,
      _action: PayloadAction<string>,
    ) => {
      state.testExecutionLoading = true;
    },
    fetchTestExecutionForDeviceSuccess: (
      state,
      action: PayloadAction<TestExecutionResponse>,
    ) => {
      state.cancelled = TestsInitialState.cancelled;
      state.currentTestExecution = action.payload;
      // state.selectedSuites = action.payload.testSuits;
      // state.selectedTestCases = action.payload.testCases;
      state.selectedData.buildID = action.payload.buildId;
      state.selectedData.deviceID = action.payload.deviceId;
      state.selectedData.testPlan = Number(action.payload.testPlanId);
      if (!state.logs[action.payload.testId]) {
        state.logs[action.payload.testId] = [];
      }
      state.logs[action.payload.testId] = action.payload.logs;
      state.error = '';
      state.currentTestPlan =
        state.testPlans[action.payload.buildId]?.items.find(
          (testPlan) => testPlan.id === Number(action.payload.testPlanId),
        ) ?? null;
      state.testExecutionLoading = false;
    },
    fetchTestExecutionForDeviceFailure: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.testExecutionLoading = false;
      state.testExecutionID = '';
      state.currentTestExecution = null;
      state.error = action.payload;
      state.selectedTestCases = TestsInitialState.selectedTestCases;
      state.selectedSuites = TestsInitialState.selectedSuites;
    },
    downloadTestExecutionRequest: (state) => {
      state.download.downloading = true;
    },
    downloadTestExecutionSuccess: (state) => {
      state.download.downloading = false;
      state.download.error = null;
    },
    downloadTestExecutionFailure: (state, action: PayloadAction<string>) => {
      state.download.downloading = false;
      state.download.error = action.payload;
    },
    fetchTestPlanSummaryRequest: (state) => {
      state.testPlanSummary.loading = true;
    },
    fetchTestPlanSummarySuccess: (
      state,
      action: PayloadAction<TestPlanSummary>,
    ) => {
      state.testPlanSummary = {
        ...action.payload,
        loading: false,
        error: null,
      };
    },
    fetchTestPlanSummaryFailure: (state, action: PayloadAction<string>) => {
      state.testPlanSummary.loading = false;
      state.testPlanSummary.error = action.payload;
    },
    resetTests: () => TestsInitialState,
    clearErrors: (state) => {
      state.error = '';
      state.testExecutionError = null;
      state.cancelled.error = '';
    },
    clearSelected: (state) => {
      Object.assign(state, selectedInitialState);
    },
  },
});

export const {
  clearErrors,
  setDeviceFamily,
  setDeviceID,
  setBuildID,
  setBuildIDFailure,
  setBuildIDSuccess,
  setTestPlan,
  resetTestsFormData,
  fetchTestPlansRequest,
  fetchTestCasesRequest,
  fetchTestSuitesRequest,
  fetchTestCasesFailure,
  fetchTestCasesSuccess,
  fetchTestPlansFailure,
  fetchTestPlansSuccess,
  fetchTestSuitesFailure,
  fetchTestSuitesSuccess,
  fetchAllTestCasesFailure,
  fetchAllTestCasesRequest,
  fetchAllTestCasesSuccess,
  toggleSuite,
  toggleTestCase,
  toggleSelectAll,
  testExecutionFailure,
  testExecutionRequest,
  testExecutionSuccess,
  getTestExecutionFailure,
  getTestExecutionRequest,
  getTestExecutionSuccess,

  getTestExecutionResultRequest,
  getTestExecutionResultSuccess,
  getTestExecutionResultFailure,
  getSingleTestExecutionResultRequest,
  getSingleTestExecutionResultSuccess,
  getSingleTestExecutionResultFailure,
  fetchTestExecutionsFailure,
  fetchTestExecutionsRequest,
  fetchTestExecutionsSuccess,
  getSelectedTestExecutionRequest,
  getSelectedTestExecutionSuccess,
  getSelectedTestExecutionFailure,
  fetchTestExecutionAnalyticsRequest,
  fetchTestExecutionAnalyticsSuccess,
  fetchTestExecutionAnalyticsFailure,
  getInProgressTestExecutionsRequest,
  getInProgressTestExecutionsSuccess,
  getInProgressTestExecutionsFailure,
  cancelTestExecutionFailure,
  cancelTestExecutionRequest,
  cancelTestExecutionSuccess,
  resetTests,
  fetchInProgressTestsListFailure,
  fetchInProgressTestsListRequest,
  fetchInProgressTestsListSuccess,
  fetchTestExecutionForDeviceFailure,
  fetchTestExecutionForDeviceRequest,
  fetchTestExecutionForDeviceSuccess,
  downloadTestExecutionFailure,
  downloadTestExecutionSuccess,
  downloadTestExecutionRequest,
  fetchTestPlanSummaryFailure,
  fetchTestPlanSummaryRequest,
  fetchTestPlanSummarySuccess,
  clearSelected,
} = testsSlice.actions;

export default testsSlice.reducer;
