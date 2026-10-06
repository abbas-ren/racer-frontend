import { IDevice } from './types';

export type TestPlan = {
  id: number;
  name: string;
  description: string | null;
};

export type TestPlanResponse = Pagination<TestPlan>;

export type TestSuite = {
  id: number;
  name: string;
  planId: number;
  order: number;
  description: string | null;
};

export type TestCase = {
  id: number;
  title: string;
  planId: number;
  suiteId: number;
  order: number;
  priorityId: number;
  scriptFile: string;
};

export interface TestCaseEntryForLogs {
  testCaseId: number;
  suiteId: number;
  result?: string;
  title: string;
  jiraDefect?: string;
  scriptFile: string;
  comment?: string;
  suiteName: string;
  id: number;
  updatedAt: string;
  createdAt: string;
  outputFilePath?: string;
  dmesgFilePath?: string;
}

// Generic pagination type used across NewTests slice
export interface Pagination<T> {
  _links: {
    next: string | null;
    prev: string | null;
  };
  offset: number;
  limit: number;
  size: number;
  data: T[];
}

// Non-paginated list type used for suites (returns whole data)
export interface SimpleList<T> {
  total: number;
  data: T[];
}

export interface TestSuiteWithCases extends TestSuite {
  cases?: TestCase[];
}

export interface TestPlanWithSuites extends TestPlan {
  suites?: SimpleList<TestSuiteWithCases>;
}

export interface TestsPaginationState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export type TestPlansResponseType = {
  total: number;
  data: TestPlan[];
};

export interface FetchQueryProps {
  page?: number;
  limit?: number;
  url?: string | null;
  filter?: string;
  buildId?: string;
  planId?: number;
  suiteId?: number;
  offset?: number;
  deviceId?: string;
}

// DRY alias for tests domain queries
export type TestsQuery = FetchQueryProps;

// Tests saga/request payloads (shared across frontend)
export interface TestsFetchPlans {
  tabId: string;
  limit?: number;
  offset?: number;
}

export interface TestsFetchSuites {
  tabId: string;
  planId: string | number;
  limit?: number;
  offset?: number;
}

export interface TestsFetchCases {
  tabId: string;
  planId: string | number;
  suiteId?: string | number;
  limit?: number;
  offset?: number;
}

export interface TestsSubmit {
  tabId: string;
  name: string;
  deviceFamily: string;
  buildId: string;
  selection?: TestExecutionSelection;
}

export type Timestamped = {
  createdOn: string;
  createdBy: string;
  updatedOn?: string;
  updatedBy?: string;
};

export type TestCaseByTestSuits = {
  [key: number]: TestCase[];
};

export interface TestCaseEntry {
  testCaseId: number;
  result?: string;
  title: string;
  planId: number;
  suiteName: string;
  suiteId: number;
  order?: number;
  priorityId?: number;
  scriptFile: string;
  executionId?: string;
  updatedAt: string;
}

export interface TestSuiteEntry {
  id: number;
  name: string;
}

export interface TestExecutionPayload {
  name: string;
  deviceFamily: string;
  deviceId: string;
  buildId: string;
  testPlanId: number | null;
  testSuites: number[];
  testCases: Record<number, TestCaseEntry[]>;
  testPlanName: string;
  isAllSelected: boolean;
}

// Selection-based execution payload
export interface TestExecutionSelectionPartialSuite {
  suiteId: string;
  selectAll: boolean;
  cases?: string[];
  excludeCases?: string[];
}

export interface TestExecutionSelectionExclude {
  suites?: string[];
  cases?: Record<string, string[]>;
}

export interface TestExecutionSelectionInclude {
  suites?: string[];
  cases?: Record<string, string[]>;
}

export interface TestExecutionSelection {
  mode: 'ALL' | 'PARTIAL';
  exclude?: TestExecutionSelectionExclude;
  include?: TestExecutionSelectionInclude;
}

export interface TestExecutionPayloadNew {
  name: string;
  deviceFamily: string;
  buildId: string;
  selection: TestExecutionSelection;
}

export interface TestCycleResponse {
  testId: string;
}

export enum TestStatus {
  NOT_EXECUTED = 'not_executed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  QUEUED = 'queued',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface TestExecutionUpdate {
  testId: string;
  type: 'status' | 'log' | 'new' | 'cancel_requested' | 'rtos_log';
  data: {
    status?: TestStatus;
    message?: string;
    timestamp: string;
    cancelRequested?: boolean;
    phase?: string;
    rtosLogPath?: string;
  };
}

export interface SelectionInput {
  mode: 'ALL' | 'PARTIAL';
  planId: string;
  planName?: string;
  exclude?: {
    suites?: string[];
    casesBySuite?: Record<string, string[]>;
  };
  suites?: Array<{
    suiteId: string;
    selectAll: boolean;
    cases?: string[];
  }>;
}

export interface TestExecutionResponse {
  id: number;
  testId: string;
  deviceFamily: string;
  deviceType: string;
  deviceId: string;
  buildId: string;
  testPlanId: number;
  testSuits: TestSuiteEntry[];
  testCases: Record<number, TestCaseEntry[]>;
  logs: string[];
  selectionInput?: SelectionInput;
  createdAt?: Date;
  updatedAt?: Date;
  status: TestStatus;
  testPlanName: string;
  Device: IDevice;
  cancelRequested?: boolean;
}

export interface TestExecutionResultResponse {
  testCases: Record<number, TestCaseEntry[]>;
  status: TestStatus;
}

export interface TestCaseByBuild {
  id: number;
  testCaseId: number;
  suiteId: number;
  suiteName: string;
  title: string;
  result?: string;
  updatedAt?: string;
}

export interface TestExecutionByBuild {
  id: number;
  testId: string;
  buildId: string;
  testPlanName: string;
  status: TestStatus;
  testCases: TestCaseByBuild[];
}

export interface TestExecutionsByBuildResponse {
  limit: number;
  offset: number;
  total: number;
  executions: TestExecutionByBuild[];
}

export interface TestExecutionForTable {
  durationSeconds: number;
  total: number;
  passed: number;
  failed: number;
  buildId: string;
  buildVersion: string;
  deviceName: string;
  testId: string;
  status: TestStatus;
  testPlanName: string;
  logs: string[];
  testCases: Record<number, TestCaseEntry[]>;
  rtosLogPath?: string;
  analytics?: {
    allTime: AggregatedResult;
    currentWeek: AggregatedResult;
    currentMonth: AggregatedResult;
  };
}
export interface TestExecutionsForTableResponse {
  data: TestExecutionForTable[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export type AggregatedResult = {
  total: number;
  passed: number;
  failed: number;
  inProgress: number;
  week?: string;
  month?: string;
};

export interface TestExecutionAnalyticsResponse {
  allTime: AggregatedResult;
  weekly: AggregatedResult[];
  monthly: AggregatedResult[];
}

export interface InProgressTestExecutionResponse {
  id: string;
  testPlanName: string;
  createdAt?: Date;
  startedAt?: Date | undefined;
  endedAt?: Date | undefined;
  status?: TestStatus;
  total: number;
  executed: number;
}

export interface InProgressTestsList {
  deviceId: string;
  status: TestStatus;
  testId: string;
}

export interface TestPlanSummary {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  cancelled: number;
}

export type ReleaseTestStatus = 'untested' | 'testing' | 'passed' | 'failed';

export interface ReleaseAttributes {
  id: string;
  version: string;
  status?: ReleaseTestStatus;
  lastScannedAt: Date | null;
  createdAt?: Date;
  isFaulty?: boolean;
}
