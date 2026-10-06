import type { TestCaseEntryForLogs, TestStatus } from 'types/tests';
import type { ReleaseAttributes } from 'typesCustom/tests';
export interface TabFilters {
  deviceFamily: string;
  deviceType: string;
  buildID: string;
  testPlan: string | null;
  deviceID?: string; // Optional filter for specific device, if needed in future
}

export type DeviceFamily = string;
export type DeviceType = string;
export type Build = ReleaseAttributes;

export interface TestPlan {
  id: number;
  name: string;
  description: string | null;
}

export interface TestSuite {
  id: number;
  name: string;
  planId: number;
  order: number;
  description: string | null;
}

export interface TestCase {
  id: number;
  title: string;
  planId: number;
  suiteId: number;
  order: number;
  priorityId: number;
  scriptFile: string;
}

export interface PartialSuites {
  suiteId: string;
  selectAll: boolean;
  cases?: string[];
  excludeCases?: string[];
}

export interface SelectionExclude {
  suites: number[];
  cases: Record<number, number[]>;
}

export interface SelectionInclude {
  suites: number[];
  cases: Record<number, number[]>;
}

export interface ResourceState<T = unknown> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export interface TestPlanSelectionRules {
  mode: 'ALL' | 'PARTIAL';
  exclude: SelectionExclude;
  include: SelectionInclude;
}

export interface TabData {
  deviceFamilies: ResourceState<DeviceFamily>;
  deviceTypes: ResourceState<DeviceType>;
  builds: ResourceState<Build>;
  deviceBuilds?: Record<string, ReleaseAttributes[]>; // Map of deviceType to builds
  testPlans: ResourceState<TestPlan>;
  testSuites: ResourceState<TestSuite>;
  // Track suites fetch to avoid loops when no suites available
  lastFetchedPlanId?: number | null;
  testSuitesLoaded?: boolean;
  testCasesBySuiteId: {
    [suiteId: number]: ResourceState<TestCase>;
  };
  testPlanSelectionRules: TestPlanSelectionRules;
  expandedSuiteIds?: string[];
  selection?: TestPlanSelectionRules; // Alias for testPlanSelectionRules for backward compatibility
  // Execution details bound to this tab
  testExecutionId?: string | null;
  testExecution?: TabExecution | null;
}

export type TabStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SingleTabState {
  id: string;
  name: string;
  status: TabStatus;
  error?: string;
  hasFetchedValues: boolean;
  pendingSync?: boolean;
  isSubmittingExecution?: boolean;
  download: {
    loading: boolean;
    error: string | null;
  };
  values: {
    status: TabStatus;
    data: TabData;
    filters: TabFilters;
    error?: string;
  };
}

export interface TabsState {
  isCreatingDefaultTab: boolean;
  error?: string;
  activeTabId?: string;
  tabsById: Record<string, SingleTabState>;
  tabOrder: string[];
}

export interface BackendTab {
  tabId: string;
  tabTitle: string | null;
  deviceFamily: string | null;
  deviceType: string | null;
  buildId: string | null;
  testPlanId: string | number | null;
  createdAt?: string;
  updatedAt?: string;
  selectionRules?: {
    mode: 'ALL' | 'PARTIAL';
    exclude?: { cases?: Record<string, number[]>; suites?: number[] };
    include?: { cases?: Record<string, number[]>; suites?: number[] };
  } | null;
  // Optional execution data attached by backend
  testExecutionId?: string | null;
  testExecution?: TabExecution | null;
}

// Execution stored in tabs: minimal shape we consume, tolerant to backend variations
export interface TabExecution {
  testId: string;
  status: TestStatus;
  logs: string[];
  testCases: TestCaseEntryForLogs[];
  deviceFamily?: string;
  deviceType?: string;
  buildId?: string;
  testPlanId?: string | number;
  startedAt?: string | Date | null;
  endedAt?: string | Date | null;
  cancelRequested?: boolean;
}
