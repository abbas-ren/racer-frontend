import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  TabFilters,
  TabData,
  SingleTabState,
  TabsState,
  TestPlan,
  TestSuite,
} from './types';
import type { TestCase, TestCaseEntryForLogs, TestStatus } from 'types/tests';
import type { TabExecution } from './types';
import type { ReleaseAttributes } from 'typesCustom/tests';

export const initialTabData = (): TabData => ({
  deviceFamilies: { items: [], loading: false, error: null },
  deviceTypes: { items: [], loading: false, error: null },
  builds: { items: [], loading: false, error: null },
  deviceBuilds: {},
  testPlans: { items: [], loading: false, error: null },
  testSuites: { items: [], loading: false, error: null },
  lastFetchedPlanId: null,
  testSuitesLoaded: false,
  testCasesBySuiteId: {},
  testPlanSelectionRules: {
    mode: 'PARTIAL',
    exclude: { suites: [], cases: {} },
    include: { suites: [], cases: {} },
  },
  expandedSuiteIds: [],
  testExecutionId: null,
  testExecution: null,
});

const createSingleTabState = (
  tabId: string,
  name?: string,
): SingleTabState => ({
  id: tabId,
  name: name ?? '',
  status: 'idle',
  hasFetchedValues: false,
  isSubmittingExecution: false,
  download: {
    loading: false,
    error: null,
  },
  values: {
    status: 'idle',
    data: initialTabData(),
    filters: {
      deviceFamily: '',
      deviceType: '',
      buildID: '',
      testPlan: null,
    },
  },
});

const initialState: TabsState = {
  isCreatingDefaultTab: false,
  error: undefined,
  activeTabId: undefined,
  tabsById: {},
  tabOrder: [],
};

// Helper to ensure tab exists
const ensureTab = (state: TabsState, tabId: string): void => {
  if (!state.tabsById[tabId]) {
    state.tabsById[tabId] = createSingleTabState(tabId);
    state.tabOrder.push(tabId);
  }
};

// Helper to clear downstream data based on hierarchy level
const clearDownstreamData = (
  data: TabData,
  level: 'family' | 'type' | 'build' | 'plan',
): void => {
  const emptyRules = {
    mode: 'PARTIAL' as const,
    exclude: { suites: [], cases: {} },
    include: { suites: [], cases: {} },
  };

  if (level === 'family') {
    data.deviceTypes.items = [];
    data.builds.items = [];
    data.testPlans.items = [];
    data.testSuites.items = [];
    data.testCasesBySuiteId = {};
    data.testPlanSelectionRules = emptyRules;
  } else if (level === 'type') {
    data.builds.items = [];
    data.testPlans.items = [];
    data.testSuites.items = [];
    data.testCasesBySuiteId = {};
    data.testPlanSelectionRules = emptyRules;
  } else if (level === 'build') {
    data.testPlans.items = [];
    data.testSuites.items = [];
    data.testCasesBySuiteId = {};
    data.testPlanSelectionRules = emptyRules;
  } else if (level === 'plan') {
    data.testSuites.items = [];
    data.testCasesBySuiteId = {};
    data.testPlanSelectionRules = emptyRules;
    data.lastFetchedPlanId = null;
    data.testSuitesLoaded = false;
  }
};

// Helper to set resource loading state
const setResourceLoading = <T extends keyof TabData>(
  data: TabData,
  resource: T,
  loading: boolean,
): void => {
  if (resource === 'testCasesBySuiteId') return;
  const res = data[resource] as { loading: boolean; error: string | null };
  res.loading = loading;
  res.error = loading ? null : res.error;
};

// Helper to set resource success state
const setResourceSuccess = <T extends keyof TabData>(
  data: TabData,
  resource: T,
  items: unknown[],
): void => {
  if (resource === 'testCasesBySuiteId') return;
  const res = data[resource] as {
    items: unknown[];
    loading: boolean;
    error: string | null;
  };
  res.loading = false;
  res.items = items;
};

// Helper to set resource error state
const setResourceError = <T extends keyof TabData>(
  data: TabData,
  resource: T,
  error: string,
): void => {
  if (resource === 'testCasesBySuiteId') return;
  const res = data[resource] as { loading: boolean; error: string | null };
  res.loading = false;
  res.error = error;
};

const tabsSlice = createSlice({
  name: 'testExecutions',
  initialState,
  reducers: {
    // ---------- Selection reducers (pure) ----------
    toggleSelectAll(
      state,
      action: PayloadAction<{ tabId: string; checked: boolean }>,
    ) {
      const { tabId, checked } = action.payload;
      ensureTab(state, tabId);
      const data = state.tabsById[tabId].values.data;
      if (checked) {
        data.testPlanSelectionRules = {
          mode: 'ALL',
          exclude: { suites: [], cases: {} },
          include: { suites: [], cases: {} },
        };
      } else {
        data.testPlanSelectionRules = {
          mode: 'PARTIAL',
          exclude: { suites: [], cases: {} },
          include: { suites: [], cases: {} },
        };
      }
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    toggleSuite(
      state,
      action: PayloadAction<{
        tabId: string;
        suiteId: number;
        checked: boolean;
        allCases?: number[];
      }>,
    ) {
      const { tabId, suiteId, checked } = action.payload;
      ensureTab(state, tabId);
      const data = state.tabsById[tabId].values.data;
      const rules = data.testPlanSelectionRules;

      if (rules.mode === 'ALL') {
        const exSuites = new Set(rules.exclude.suites);
        const exCases: Record<number, number[]> = { ...rules.exclude.cases };
        delete exCases[suiteId];
        if (checked) exSuites.delete(suiteId);
        else exSuites.add(suiteId);
        const isEmpty =
          exSuites.size === 0 && Object.keys(exCases).length === 0;
        data.testPlanSelectionRules = {
          mode: 'ALL',
          exclude: {
            suites: Array.from(exSuites),
            cases: exCases,
          },
          include: isEmpty ? { suites: [], cases: {} } : rules.include,
        };
      } else {
        const inSuites = new Set(rules.include.suites);
        const inCases: Record<number, number[]> = { ...rules.include.cases };
        delete inCases[suiteId];
        if (checked) inSuites.add(suiteId);
        else inSuites.delete(suiteId);
        const isEmpty =
          inSuites.size === 0 && Object.keys(inCases).length === 0;
        data.testPlanSelectionRules = {
          mode: 'PARTIAL',
          include: {
            suites: Array.from(inSuites),
            cases: inCases,
          },
          exclude: isEmpty ? { suites: [], cases: {} } : rules.exclude,
        };
      }
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    toggleCase(
      state,
      action: PayloadAction<{
        tabId: string;
        suiteId: number;
        caseId: number;
        checked: boolean;
        allCases: number[];
      }>,
    ) {
      const { tabId, suiteId, caseId, checked, allCases } = action.payload;
      ensureTab(state, tabId);
      const data = state.tabsById[tabId].values.data;
      const rules = data.testPlanSelectionRules;

      if (rules.mode === 'ALL') {
        const exSuites = new Set(rules.exclude.suites);
        const exCases: Record<number, number[]> = { ...rules.exclude.cases };
        if (exSuites.has(suiteId) && checked) {
          // Convert suite exclusion to case exclusions of others
          exSuites.delete(suiteId);
          const others = allCases.filter((id) => id !== caseId);
          if (others.length > 0) exCases[suiteId] = others;
          else delete exCases[suiteId];
        } else if (!exSuites.has(suiteId)) {
          const set = new Set(exCases[suiteId] ?? []);
          if (checked) set.delete(caseId);
          else set.add(caseId);
          const arr = Array.from(set);

          // Check if all cases are now excluded - upgrade to suite-level exclusion
          if (
            arr.length >= allCases.length &&
            allCases.length > 0 &&
            arr.length > 0
          ) {
            delete exCases[suiteId];
            exSuites.add(suiteId);
          } else if (arr.length === 0) {
            delete exCases[suiteId];
          } else {
            exCases[suiteId] = arr;
          }
        }
        const isEmpty =
          exSuites.size === 0 && Object.keys(exCases).length === 0;
        data.testPlanSelectionRules = {
          mode: 'ALL',
          exclude: { suites: Array.from(exSuites), cases: exCases },
          include: isEmpty ? { suites: [], cases: {} } : rules.include,
        };
      } else {
        const inSuites = new Set(rules.include.suites);
        const inCases: Record<number, number[]> = { ...rules.include.cases };
        if (inSuites.has(suiteId) && !checked) {
          // Downgrade suite include to case-level include of others
          inSuites.delete(suiteId);
          const others = allCases.filter((id) => id !== caseId);
          if (others.length > 0) inCases[suiteId] = others;
          else delete inCases[suiteId];
        } else if (!inSuites.has(suiteId)) {
          const set = new Set(inCases[suiteId] ?? []);
          if (checked) set.add(caseId);
          else set.delete(caseId);
          const arr = Array.from(set);
          if (arr.length === 0) {
            delete inCases[suiteId];
          } else {
            const total = allCases.length;
            if (arr.length >= total) {
              delete inCases[suiteId];
              inSuites.add(suiteId);
            } else {
              inCases[suiteId] = arr;
            }
          }
        }
        const isEmpty =
          inSuites.size === 0 && Object.keys(inCases).length === 0;
        data.testPlanSelectionRules = {
          mode: 'PARTIAL',
          include: { suites: Array.from(inSuites), cases: inCases },
          exclude: isEmpty ? { suites: [], cases: {} } : rules.exclude,
        };
      }
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    // Restore selection from selectionInput (when loading test execution from backend)
    restoreSelectionFromInput(
      state,
      action: PayloadAction<{
        tabId: string;
        selectionInput: {
          mode: 'ALL' | 'PARTIAL';
          planId: string;
          planName?: string;
          deviceType?: string;
          exclude?: {
            suites?: string[];
            casesBySuite?: Record<string, string[]>;
          };
          suites?: Array<{
            suiteId: string;
            selectAll: boolean;
            cases?: string[];
          }>;
        };
      }>,
    ) {
      const { tabId, selectionInput } = action.payload;
      ensureTab(state, tabId);
      const data = state.tabsById[tabId].values.data;

      if (selectionInput.mode === 'ALL') {
        const excludeSuites = (selectionInput.exclude?.suites ?? []).map(
          Number,
        );
        const excludeCasesBySuite: Record<number, number[]> = {};

        if (selectionInput.exclude?.casesBySuite) {
          for (const [suiteId, caseIds] of Object.entries(
            selectionInput.exclude.casesBySuite,
          )) {
            excludeCasesBySuite[Number(suiteId)] = caseIds.map(Number);
          }
        }

        data.testPlanSelectionRules = {
          mode: 'ALL',
          exclude: {
            suites: excludeSuites,
            cases: excludeCasesBySuite,
          },
          include: { suites: [], cases: {} },
        };
      } else if (selectionInput.mode === 'PARTIAL') {
        const includeSuites: number[] = [];
        const includeCases: Record<number, number[]> = {};

        for (const suite of selectionInput.suites ?? []) {
          const suiteId = Number(suite.suiteId);
          if (suite.selectAll) {
            includeSuites.push(suiteId);
          } else if (suite.cases && suite.cases.length > 0) {
            includeCases[suiteId] = suite.cases.map(Number);
          }
        }

        data.testPlanSelectionRules = {
          mode: 'PARTIAL',
          include: {
            suites: includeSuites,
            cases: includeCases,
          },
          exclude: { suites: [], cases: {} },
        };
      }
    },
    // Filters: set and handle cascading resets by hierarchy
    setTabFilters(
      state,
      action: PayloadAction<{
        tabId: string;
        filters: Partial<TabFilters>;
      }>,
    ) {
      const { tabId, filters } = action.payload;
      ensureTab(state, tabId);
      const single = state.tabsById[tabId];
      const prev = single.values.filters;

      // Device Family change - reset everything downstream
      if (
        filters.deviceFamily !== undefined &&
        filters.deviceFamily !== prev.deviceFamily
      ) {
        single.values.filters = {
          deviceFamily: filters.deviceFamily,
          deviceType: '',
          buildID: '',
          testPlan: null,
        };
        clearDownstreamData(single.values.data, 'family');
        // Clear execution when filter changes
        single.values.data.testExecutionId = null;
        single.values.data.testExecution = null;
        return;
      }

      // Device Type change - reset builds, plans, suites
      if (
        filters.deviceType !== undefined &&
        filters.deviceType !== prev.deviceType
      ) {
        single.values.filters = {
          ...prev,
          deviceType: filters.deviceType,
          buildID: '',
          testPlan: null,
        };
        clearDownstreamData(single.values.data, 'type');
        // Clear execution when filter changes
        single.values.data.testExecutionId = null;
        single.values.data.testExecution = null;
        return;
      }

      // Build change - reset plans, suites
      if (filters.buildID !== undefined && filters.buildID !== prev.buildID) {
        single.values.filters = {
          ...prev,
          buildID: filters.buildID,
          testPlan: null,
        };
        clearDownstreamData(single.values.data, 'build');
        // Clear execution when filter changes
        single.values.data.testExecutionId = null;
        single.values.data.testExecution = null;
        return;
      }

      // Test Plan change - reset suites only
      if (
        filters.testPlan !== undefined &&
        filters.testPlan !== prev.testPlan
      ) {
        single.values.filters = {
          ...prev,
          testPlan: filters.testPlan,
        };
        clearDownstreamData(single.values.data, 'plan');

        // Update tab name with test plan name
        if (filters.testPlan) {
          const testPlans = single.values.data.testPlans.items;
          const selectedPlan = testPlans.find(
            (p) => String(p.id) === filters.testPlan,
          );
          if (selectedPlan) {
            single.name = selectedPlan.name;
          }
        } else {
          // Reset to default if no test plan selected
          single.name = '';
        }
        return;
      }

      // Fallback merge (no hierarchy change)
      single.values.filters = { ...prev, ...filters };
    },
    setTabFiltersFromExecution(
      state,
      action: PayloadAction<{
        tabId: string;
        filters: TabFilters;
      }>,
    ) {
      const { tabId, filters } = action.payload;
      ensureTab(state, tabId);
      state.tabsById[tabId].values.filters = filters;
    },
    initializeTabs(state) {
      // If no tabs exist, create a default one
      if (state.tabOrder.length === 0) {
        const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        state.tabsById[tabId] = createSingleTabState(tabId);
        state.tabOrder.push(tabId);
        state.activeTabId = tabId;
      } else if (!state.activeTabId) {
        // Set active tab if not set
        state.activeTabId = state.tabOrder[0];
      }
      state.error = undefined;
    },
    // Store/replace execution for a tab by tabId
    setTabExecution(
      state,
      action: PayloadAction<{
        tabId: string;
        execution: TabExecution;
      }>,
    ) {
      const { tabId, execution } = action.payload;
      ensureTab(state, tabId);
      const data = state.tabsById[tabId].values.data;
      data.testExecutionId = execution.testId;
      data.testExecution = execution;
    },
    updateExecutionStatus(
      state,
      action: PayloadAction<{ testId: string; status: TestStatus }>,
    ) {
      const { testId, status } = action.payload;
      const tabId = state.tabOrder.find((id) => {
        const exec = state.tabsById[id]?.values.data.testExecution;
        return exec && exec.testId === testId;
      });
      if (!tabId) return;
      const exec = state.tabsById[tabId].values.data.testExecution;
      if (!exec) return;
      exec.status = status;
    },
    updateExecutionCancelRequested(
      state,
      action: PayloadAction<{ testId: string; cancelRequested: boolean }>,
    ) {
      const { testId, cancelRequested } = action.payload;
      const tabId = state.tabOrder.find((id) => {
        const exec = state.tabsById[id]?.values.data.testExecution;
        return exec && exec.testId === testId;
      });
      if (!tabId) return;
      const exec = state.tabsById[tabId].values.data.testExecution;
      if (!exec) return;
      exec.cancelRequested = cancelRequested;
    },
    // Upsert a log line into the tab that matches testId
    upsertExecutionLog(
      state,
      action: PayloadAction<{ testId: string; message: string }>,
    ) {
      const { testId, message } = action.payload;
      const tabId = state.tabOrder.find((id) => {
        const exec = state.tabsById[id]?.values.data.testExecution;
        return exec && exec.testId === testId;
      });
      if (!tabId) return;
      const exec = state.tabsById[tabId].values.data.testExecution;
      if (!exec) return;
      const logs = Array.isArray(exec.logs) ? exec.logs : [];
      // Avoid duplicates
      if (!logs.includes(message)) {
        exec.logs = [...logs, message];
      }
    },
    // Batch-upsert multiple log lines keyed by testId in one state update
    batchUpsertExecutionLogs(
      state,
      action: PayloadAction<{ testId: string; messages: string[] }[]>,
    ) {
      for (const entry of action.payload) {
        const { testId, messages } = entry;
        const tabId = state.tabOrder.find((id) => {
          const exec = state.tabsById[id]?.values.data.testExecution;
          return exec && exec.testId === testId;
        });
        if (!tabId) continue;
        const exec = state.tabsById[tabId].values.data.testExecution;
        if (!exec) continue;
        const logs = Array.isArray(exec.logs) ? exec.logs : [];
        const existing = new Set(logs);
        const newLogs = messages.filter((m) => !existing.has(m));
        if (newLogs.length > 0) {
          exec.logs = [...logs, ...newLogs];
        }
      }
    },
    // Replace execution test cases and update status for the matching testId
    setExecutionCases(
      state,
      action: PayloadAction<{
        testId: string;
        testCases: TestCaseEntryForLogs[];
        status?: TestStatus;
      }>,
    ) {
      const { testId, testCases, status } = action.payload;
      const tabId = state.tabOrder.find((id) => {
        const exec = state.tabsById[id]?.values.data.testExecution;
        return exec && exec.testId === testId;
      });
      if (!tabId) return;
      const exec = state.tabsById[tabId].values.data.testExecution;
      if (!exec) return;
      // Convert incoming testCases (Record) to match shape if necessary
      exec.testCases = testCases;
      if (status) {
        exec.status = status;
      }
    },
    // Clear execution logs for the matching testId
    clearExecutionLogs(state, action: PayloadAction<{ testId: string }>) {
      const { testId } = action.payload;
      const tabId = state.tabOrder.find((id) => {
        const exec = state.tabsById[id]?.values.data.testExecution;
        return exec && exec.testId === testId;
      });
      if (!tabId) return;
      const exec = state.tabsById[tabId].values.data.testExecution;
      if (!exec) return;
      exec.logs = [];
      exec.testCases = [];
    },
    clearTabExecution(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      ensureTab(state, tabId);
      const data = state.tabsById[tabId].values.data;
      data.testExecutionId = null;
      data.testExecution = null;
    },
    // WebSocket: raw log event received; saga will process this into upsert + refresh
    wsExecutionLogReceived(
      _state,
      _action: PayloadAction<{ testId: string; message: string }>,
    ) {},
    wsExecutionStatusUpdate(
      _state,
      _action: PayloadAction<{ testId: string; status: TestStatus }>,
    ) {},
    // Request to refresh execution cases by testId (handled by saga)
    refreshExecutionCasesRequest(
      _state,
      _action: PayloadAction<{ testId: string }>,
    ) {},
    createTabRequest(state) {
      state.isCreatingDefaultTab = true;
      state.error = undefined;
    },
    createTabSuccess(state, action: PayloadAction<{ tabId: string }>) {
      state.isCreatingDefaultTab = false;
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) {
        state.tabsById[tabId] = createSingleTabState(tabId);
        state.tabOrder.push(tabId);
      }
      state.activeTabId = tabId;
    },
    createTabFailure(state, action: PayloadAction<string>) {
      state.isCreatingDefaultTab = false;
      state.error = action.payload;
    },
    deleteTabRequest(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      if (state.tabsById[tabId]) {
        state.tabsById[tabId].status = 'loading';
      }
    },
    deleteTabSuccess(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      delete state.tabsById[tabId];
      state.tabOrder = state.tabOrder.filter((id) => id !== tabId);
      // Set new active tab if deleted tab was active
      if (state.activeTabId === tabId) {
        state.activeTabId = state.tabOrder[0] || undefined;
      }
    },
    deleteTabFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      if (state.tabsById[tabId]) {
        state.tabsById[tabId].status = 'error';
        state.tabsById[tabId].error = error;
      }
    },
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTabId = action.payload;
    },
    updateTabName(
      state,
      action: PayloadAction<{ tabId: string; name: string }>,
    ) {
      const { tabId, name } = action.payload;
      if (state.tabsById[tabId]) {
        state.tabsById[tabId].name = name;
      }
    },
    // Fetch Device Families
    fetchDeviceFamiliesRequest(
      state,
      action: PayloadAction<{ tabId: string }>,
    ) {
      const { tabId } = action.payload;
      ensureTab(state, tabId);
      setResourceLoading(
        state.tabsById[tabId].values.data,
        'deviceFamilies',
        true,
      );
    },
    fetchDeviceFamiliesSuccess(
      state,
      action: PayloadAction<{ tabId: string; items: string[] }>,
    ) {
      const { tabId, items } = action.payload;
      if (!state.tabsById[tabId]) {
        return;
      }
      setResourceSuccess(
        state.tabsById[tabId].values.data,
        'deviceFamilies',
        items,
      );
    },
    fetchDeviceFamiliesFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      if (!state.tabsById[tabId]) {
        return;
      }
      setResourceError(
        state.tabsById[tabId].values.data,
        'deviceFamilies',
        error,
      );
    },

    // Fetch Device Types
    fetchDeviceTypesRequest(
      state,
      action: PayloadAction<{ tabId: string; deviceFamily: string }>,
    ) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceLoading(
        state.tabsById[tabId].values.data,
        'deviceTypes',
        true,
      );
    },
    fetchDeviceTypesSuccess(
      state,
      action: PayloadAction<{ tabId: string; items: string[] }>,
    ) {
      const { tabId, items } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceSuccess(
        state.tabsById[tabId].values.data,
        'deviceTypes',
        items,
      );
    },
    fetchDeviceTypesFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceError(state.tabsById[tabId].values.data, 'deviceTypes', error);
    },

    // Fetch Builds
    fetchBuildsRequest(
      state,
      action: PayloadAction<{ tabId: string; deviceType: string }>,
    ) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceLoading(state.tabsById[tabId].values.data, 'builds', true);
    },
    fetchBuildsSuccess(
      state,
      action: PayloadAction<{
        tabId: string;
        deviceType: string;
        items: ReleaseAttributes[];
      }>,
    ) {
      const { tabId, deviceType, items } = action.payload;
      if (!state.tabsById[tabId]) return;
      // Store builds in the items array for loading state
      setResourceSuccess(state.tabsById[tabId].values.data, 'builds', items);
      // Also store in deviceBuilds map for dropdown access
      if (!state.tabsById[tabId].values.data.deviceBuilds) {
        state.tabsById[tabId].values.data.deviceBuilds = {};
      }
      state.tabsById[tabId].values.data.deviceBuilds[deviceType] = items;
    },
    fetchBuildsFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceError(state.tabsById[tabId].values.data, 'builds', error);
    },
    // Alias for backward compatibility
    fetchBuildsForDeviceTypeRequest(
      state,
      action: PayloadAction<{ tabId: string; deviceType: string }>,
    ) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceLoading(state.tabsById[tabId].values.data, 'builds', true);
    },

    // Fetch Test Plans
    fetchTabTestPlansRequest(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceLoading(state.tabsById[tabId].values.data, 'testPlans', true);
    },
    fetchTabTestPlansSuccess(
      state,
      action: PayloadAction<{ tabId: string; items: TestPlan[] }>,
    ) {
      const { tabId, items } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceSuccess(state.tabsById[tabId].values.data, 'testPlans', items);
    },
    fetchTabTestPlansFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceError(state.tabsById[tabId].values.data, 'testPlans', error);
    },

    // Fetch Test Suites
    fetchTabTestSuitesRequest(
      state,
      action: PayloadAction<{ tabId: string; planId: number }>,
    ) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceLoading(state.tabsById[tabId].values.data, 'testSuites', true);
      // Record which plan suites are being fetched
      state.tabsById[tabId].values.data.lastFetchedPlanId =
        action.payload.planId;
      state.tabsById[tabId].values.data.testSuitesLoaded = false;
    },
    fetchTabTestSuitesSuccess(
      state,
      action: PayloadAction<{ tabId: string; items: TestSuite[] }>,
    ) {
      const { tabId, items } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceSuccess(
        state.tabsById[tabId].values.data,
        'testSuites',
        items,
      );
      state.tabsById[tabId].values.data.testSuitesLoaded = true;
    },
    fetchTabTestSuitesFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      if (!state.tabsById[tabId]) return;
      setResourceError(state.tabsById[tabId].values.data, 'testSuites', error);
      state.tabsById[tabId].values.data.testSuitesLoaded = true;
    },
    // Selection-related actions
    setExpandedSuites(
      state,
      action: PayloadAction<{ tabId: string; expanded: string[] }>,
    ) {
      const { tabId, expanded } = action.payload;
      if (!state.tabsById[tabId]) return;
      state.tabsById[tabId].values.data.expandedSuiteIds = expanded;
    },
    clearSuiteSelections(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      state.tabsById[tabId].values.data.testPlanSelectionRules.include.suites =
        [];
      state.tabsById[tabId].values.data.testPlanSelectionRules.include.cases =
        {};
    },
    resetGlobalExcludes(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      if (!state.tabsById[tabId]) return;
      state.tabsById[tabId].values.data.testPlanSelectionRules.exclude.suites =
        [];
      state.tabsById[tabId].values.data.testPlanSelectionRules.exclude.cases =
        {};
    },
    setGlobalExcludeSuites(
      state,
      action: PayloadAction<{ tabId: string; suiteIds: number[] }>,
    ) {
      const { tabId, suiteIds } = action.payload;
      console.log('tabId', tabId, 'suiteIds', suiteIds);
      if (!state.tabsById[tabId]) return;
      state.tabsById[tabId].values.data.testPlanSelectionRules.exclude.suites =
        suiteIds;
      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    setGlobalExcludeCases(
      state,
      action: PayloadAction<{
        tabId: string;
        cases: Record<number, number[]>;
      }>,
    ) {
      const { tabId, cases } = action.payload;
      console.log('tabId', tabId, 'cases', cases);
      if (!state.tabsById[tabId]) return;
      state.tabsById[tabId].values.data.testPlanSelectionRules.exclude.cases =
        cases;
      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    upsertSuiteSelection(
      state,
      action: PayloadAction<{
        tabId: string;
        suiteId: number;
        selectAll: boolean;
        cases?: number[];
      }>,
    ) {
      const { tabId, suiteId, selectAll, cases } = action.payload;
      if (!state.tabsById[tabId]) return;
      const { include } =
        state.tabsById[tabId].values.data.testPlanSelectionRules;

      if (selectAll) {
        // Selecting all cases - add suite to include.suites
        if (!include.suites.includes(suiteId)) {
          include.suites.push(suiteId);
        }
        // Remove from include.cases if selecting all
        delete include.cases[suiteId];
      } else if (cases && cases.length > 0) {
        // Selecting individual cases - remove suite from include.suites
        include.suites = include.suites.filter((id) => id !== suiteId);
        include.cases[suiteId] = cases;
      }

      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    removeSuiteSelection(
      state,
      action: PayloadAction<{ tabId: string; suiteId: number }>,
    ) {
      const { tabId, suiteId } = action.payload;
      console.log('removeSuiteSelection', tabId, suiteId);
      if (!state.tabsById[tabId]) return;
      const { include } =
        state.tabsById[tabId].values.data.testPlanSelectionRules;
      include.suites = include.suites.filter((id) => id !== suiteId);
      delete include.cases[suiteId];
      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    addSuiteCase(
      state,
      action: PayloadAction<{ tabId: string; suiteId: number; caseId: number }>,
    ) {
      const { tabId, suiteId, caseId } = action.payload;
      if (!state.tabsById[tabId]) return;
      const { include } =
        state.tabsById[tabId].values.data.testPlanSelectionRules;

      // Adding individual case - remove suite from include.suites if present
      include.suites = include.suites.filter((id) => id !== suiteId);

      if (!include.cases[suiteId]) {
        include.cases[suiteId] = [];
      }

      if (!include.cases[suiteId].includes(caseId)) {
        include.cases[suiteId].push(caseId);
      }

      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    removeSuiteCase(
      state,
      action: PayloadAction<{ tabId: string; suiteId: number; caseId: number }>,
    ) {
      const { tabId, suiteId, caseId } = action.payload;
      if (!state.tabsById[tabId]) return;
      const { include } =
        state.tabsById[tabId].values.data.testPlanSelectionRules;

      if (include.cases[suiteId]) {
        include.cases[suiteId] = include.cases[suiteId].filter(
          (id) => id !== caseId,
        );
        // Clean up empty arrays
        if (include.cases[suiteId].length === 0) {
          delete include.cases[suiteId];
        }
      }

      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    setSelectionMode(
      state,
      action: PayloadAction<{ tabId: string; mode: 'ALL' | 'PARTIAL' }>,
    ) {
      const { tabId, mode } = action.payload;
      if (!state.tabsById[tabId]) return;
      state.tabsById[tabId].values.data.testPlanSelectionRules.mode = mode;
      // Mark that we need to sync to backend
      state.tabsById[tabId].pendingSync = true;
      // Clear execution when selection changes
      state.tabsById[tabId].values.data.testExecutionId = null;
      state.tabsById[tabId].values.data.testExecution = null;
    },
    fetchTestCasesRequest(
      state,
      action: PayloadAction<{ tabId: string; planId: number; suiteId: string }>,
    ) {
      const { tabId, suiteId } = action.payload;
      if (!state.tabsById[tabId]) return;
      const data = state.tabsById[tabId].values.data;
      const numericSuiteId = Number(suiteId);
      if (!data.testCasesBySuiteId[numericSuiteId]) {
        data.testCasesBySuiteId[numericSuiteId] = {
          items: [],
          loading: false,
          error: null,
        };
      }
      data.testCasesBySuiteId[numericSuiteId].loading = true;
      data.testCasesBySuiteId[numericSuiteId].error = null;
    },
    fetchTestCasesSuccess(
      state,
      action: PayloadAction<{
        tabId: string;
        suiteId: string;
        items: TestCase[];
      }>,
    ) {
      const { tabId, suiteId, items } = action.payload;
      if (!state.tabsById[tabId]) return;
      const data = state.tabsById[tabId].values.data;
      const numericSuiteId = Number(suiteId);
      if (!data.testCasesBySuiteId[numericSuiteId]) {
        data.testCasesBySuiteId[numericSuiteId] = {
          items: [],
          loading: false,
          error: null,
        };
      }
      data.testCasesBySuiteId[numericSuiteId].items = items;
      data.testCasesBySuiteId[numericSuiteId].loading = false;
      data.testCasesBySuiteId[numericSuiteId].error = null;
    },
    fetchTestCasesFailure(
      state,
      action: PayloadAction<{ tabId: string; suiteId: string; error: string }>,
    ) {
      const { tabId, suiteId, error } = action.payload;
      if (!state.tabsById[tabId]) return;
      const data = state.tabsById[tabId].values.data;
      const numericSuiteId = Number(suiteId);
      if (!data.testCasesBySuiteId[numericSuiteId]) {
        data.testCasesBySuiteId[numericSuiteId] = {
          items: [],
          loading: false,
          error: null,
        };
      }
      data.testCasesBySuiteId[numericSuiteId].loading = false;
      data.testCasesBySuiteId[numericSuiteId].error = error;
    },
    submitNewTestExecutionRequest(
      _state,
      _action: PayloadAction<{
        tabId: string;
      }>,
    ) {
      // Mark submitting to show loader and prevent duplicate submissions
      const { tabId } = _action.payload;
      // Using _state due to codegen; rename for clarity
      const state = _state as unknown as TabsState;
      if (state.tabsById[tabId]) {
        state.tabsById[tabId].isSubmittingExecution = true;
      }
    },
    submitNewTestExecutionFinished(
      state,
      action: PayloadAction<{ tabId: string }>,
    ) {
      const { tabId } = action.payload;
      if (state.tabsById[tabId]) {
        state.tabsById[tabId].isSubmittingExecution = false;
      }
    },
    clearPendingSync(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      if (state.tabsById[tabId]) {
        state.tabsById[tabId].pendingSync = false;
      }
    },
    downloadLogsRequest(
      state,
      action: PayloadAction<{ tabId: string; testId: string }>,
    ) {
      // Handled in saga
      state.tabsById[action.payload.tabId].download.loading = true;
      state.tabsById[action.payload.tabId].download.error = null;
    },
    downloadLogsSuccess(state, action: PayloadAction<{ tabId: string }>) {
      const { tabId } = action.payload;
      state.tabsById[tabId].download.loading = false;
      state.tabsById[tabId].download.error = null;
    },
    downloadLogsFailure(
      state,
      action: PayloadAction<{ tabId: string; error: string }>,
    ) {
      const { tabId, error } = action.payload;
      state.tabsById[tabId].download.loading = false;
      state.tabsById[tabId].download.error = error;
    },
    loadTestExecutionRequest(
      state,
      _action: PayloadAction<{ testId: string }>,
    ) {
      state.error = undefined;
    },
    loadTestExecutionSuccess(
      state,
      action: PayloadAction<{ tabId: string; testId: string }>,
    ) {
      state.activeTabId = action.payload.tabId;
    },
    loadTestExecutionFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});

export const {
  initializeTabs,
  createTabRequest,
  createTabSuccess,
  createTabFailure,
  deleteTabRequest,
  deleteTabSuccess,
  deleteTabFailure,
  setActiveTab,
  updateTabName,
  setTabFilters,
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
  setExpandedSuites,
  clearSuiteSelections,
  resetGlobalExcludes,
  setGlobalExcludeSuites,
  setGlobalExcludeCases,
  upsertSuiteSelection,
  removeSuiteSelection,
  addSuiteCase,
  removeSuiteCase,
  setSelectionMode,
  fetchTestCasesRequest,
  fetchTestCasesSuccess,
  fetchTestCasesFailure,
  submitNewTestExecutionRequest,
  submitNewTestExecutionFinished,
  clearPendingSync,
  toggleSelectAll,
  toggleSuite,
  toggleCase,
  restoreSelectionFromInput,
  setTabFiltersFromExecution,
  setTabExecution,
  updateExecutionStatus,
  updateExecutionCancelRequested,
  upsertExecutionLog,
  batchUpsertExecutionLogs,
  setExecutionCases,
  clearExecutionLogs,
  clearTabExecution,
  refreshExecutionCasesRequest,
  wsExecutionLogReceived,
  wsExecutionStatusUpdate,
  downloadLogsFailure,
  downloadLogsRequest,
  downloadLogsSuccess,
  loadTestExecutionRequest,
  loadTestExecutionSuccess,
  loadTestExecutionFailure,
} = tabsSlice.actions;

export default tabsSlice.reducer;
