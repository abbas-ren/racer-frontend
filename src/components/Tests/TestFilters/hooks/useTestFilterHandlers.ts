import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTabFilters,
  submitNewTestExecutionRequest,
  fetchTabTestPlansRequest,
  fetchTabTestSuitesRequest,
  setExpandedSuites,
  clearSuiteSelections,
  resetGlobalExcludes,
  fetchBuildsForDeviceTypeRequest,
  fetchDeviceTypesRequest,
} from 'store/slices/testExecution/testExecutionsSlice';
import { cancelTestExecutionRequest } from 'store/slices';
import {
  selectActiveTabId,
  selectActiveTab,
} from 'store/slices/testExecution/selectors';
import { TestPlanWithSuites, TestStatus } from 'typesCustom/tests';
import { hasAnySelection } from 'utils/testSelectionHelpers';
import type { FilterOption } from '../TestFilters';

/**
 * Custom hook that encapsulates all TestFilters state derivation and
 * event handlers: filter options, loading states, cascade fetching,
 * run/stop logic, and report issue integration.
 */
export default function useTestFilterHandlers(execution?: {
  testId: string;
  status: TestStatus;
}) {
  const dispatch = useDispatch();
  const currentTab = useSelector(selectActiveTabId);
  const activeTab = useSelector(selectActiveTab);

  // Data from store
  const deviceFamilies = activeTab?.values.data.deviceFamilies.items || [];
  const deviceTypes = activeTab?.values.data.deviceTypes.items || [];
  const deviceBuildsMap = activeTab?.values.data.deviceBuilds || {};
  const hasDeviceFamilies = deviceFamilies.length > 0;

  // Loading states
  const isLoadingDeviceFamilies =
    activeTab?.values.data.deviceFamilies.loading || false;
  const isLoadingDeviceTypes =
    activeTab?.values.data.deviceTypes.loading || false;
  const isLoadingBuilds = activeTab?.values.data.builds.loading || false;
  const isLoadingTestPlans = activeTab?.values.data.testPlans.loading || false;
  const isLoadingTestSuites =
    activeTab?.values.data.testSuites.loading || false;

  // Filters
  const filters = activeTab?.values.filters || {
    deviceFamily: '',
    deviceType: '',
    buildID: '',
    testPlan: null,
  };

  // Filter options
  const deviceFamilyOptions: FilterOption[] = hasDeviceFamilies
    ? [
        { value: 'ALL', label: 'All' },
        ...deviceFamilies.map((df) => ({ value: df, label: df })),
      ]
    : [];
  const deviceOptions: FilterOption[] = deviceTypes.map((d) => ({
    value: d,
    label: d,
  }));
  const buildOptions: FilterOption[] = (
    (deviceBuildsMap[filters.deviceType] as
      | { id: string; version: string; isFaulty?: boolean }[]
      | undefined) || []
  ).map((b) => ({ value: b.id, label: b.version, disabled: b.isFaulty }));
  const plans = useMemo(
    () => activeTab?.values.data.testPlans.items || [],
    [activeTab?.values.data.testPlans.items],
  );
  const testPlanOptions: FilterOption[] = (plans as TestPlanWithSuites[]).map(
    (p) => ({
      value: String(p.id),
      label: p.name,
    }),
  );

  // Submission / execution state
  const isSubmitting = activeTab?.isSubmittingExecution || false;

  // Lock filters & suite selection while tests are running/queued/submitting.
  // Allow changes once execution reaches completed, cancelled, or failed.
  const isLocked =
    isSubmitting ||
    (!!execution &&
      (execution.status === TestStatus.IN_PROGRESS ||
        execution.status === TestStatus.QUEUED ||
        execution.status === TestStatus.NOT_EXECUTED));

  const disableDeviceFamily =
    isLocked || isLoadingDeviceFamilies || !hasDeviceFamilies;

  // Disable states – also locked while execution is running
  const disableDevice =
    isLocked ||
    !hasDeviceFamilies ||
    !filters.deviceFamily ||
    isLoadingDeviceTypes;
  const disableBuild =
    isLocked ||
    !hasDeviceFamilies ||
    !filters.deviceType ||
    filters.deviceType === 'all' ||
    isLoadingBuilds;
  const disableTestPlan =
    isLocked || !hasDeviceFamilies || !filters.buildID || isLoadingTestPlans;

  // Run button state
  const selection = activeTab?.values.data.testPlanSelectionRules;
  const testSuites = useMemo(
    () => activeTab?.values.data.testSuites.items || [],
    [activeTab?.values.data.testSuites.items],
  );
  const totalSuitesCount = testSuites.length;
  const hasSelection = useMemo(
    () => hasAnySelection(selection, totalSuitesCount),
    [selection, totalSuitesCount],
  );
  const disableRun =
    !hasDeviceFamilies ||
    !filters.testPlan ||
    isLoadingTestSuites ||
    !hasSelection;

  const isRunning =
    !!execution &&
    (execution.status === TestStatus.IN_PROGRESS ||
      execution.status === TestStatus.QUEUED ||
      execution.status === TestStatus.NOT_EXECUTED);

  const isCancelling = isRunning && !!execution?.cancelRequested;

  const canRerun =
    !!execution &&
    (execution.status === TestStatus.COMPLETED ||
      execution.status === TestStatus.CANCELLED ||
      execution.status === TestStatus.FAILED);

  // Helper: clear suite-related state
  const clearSuitesAndSelection = useCallback(() => {
    if (!currentTab) return;
    dispatch(setExpandedSuites({ tabId: currentTab, expanded: [] }));
    dispatch(clearSuiteSelections({ tabId: currentTab }));
    dispatch(resetGlobalExcludes({ tabId: currentTab }));
  }, [currentTab, dispatch]);

  // Cascade handlers
  const handleDeviceFamilyChange = useCallback(
    (value: string) => {
      if (!currentTab) return;
      dispatch(
        setTabFilters({ tabId: currentTab, filters: { deviceFamily: value } }),
      );
      clearSuitesAndSelection();
      if (value && value !== 'ALL') {
        dispatch(
          fetchDeviceTypesRequest({ tabId: currentTab, deviceFamily: value }),
        );
      }
    },
    [currentTab, dispatch, clearSuitesAndSelection],
  );

  const handleDeviceChange = useCallback(
    (value: string) => {
      if (!currentTab) return;
      dispatch(
        setTabFilters({ tabId: currentTab, filters: { deviceType: value } }),
      );
      clearSuitesAndSelection();
      if (value) {
        dispatch(
          fetchBuildsForDeviceTypeRequest({
            tabId: currentTab,
            deviceType: value,
          }),
        );
      }
    },
    [currentTab, dispatch, clearSuitesAndSelection],
  );

  const handleBuildChange = useCallback(
    (value: string) => {
      if (!currentTab) return;
      dispatch(
        setTabFilters({ tabId: currentTab, filters: { buildID: value } }),
      );
      clearSuitesAndSelection();
      if (value) {
        dispatch(fetchTabTestPlansRequest({ tabId: currentTab }));
      }
    },
    [currentTab, dispatch, clearSuitesAndSelection],
  );

  const handleTestPlanChange = useCallback(
    (value: string) => {
      if (!currentTab) return;
      dispatch(
        setTabFilters({ tabId: currentTab, filters: { testPlan: value } }),
      );
      clearSuitesAndSelection();
      if (value) {
        dispatch(
          fetchTabTestSuitesRequest({
            tabId: currentTab,
            planId: Number(value),
          }),
        );
      }
    },
    [currentTab, dispatch, clearSuitesAndSelection],
  );

  const handleRunOrStop = useCallback(() => {
    if (!currentTab) return;
    if (isRunning && execution?.testId) {
      dispatch(cancelTestExecutionRequest(execution.testId));
      return;
    }
    dispatch(submitNewTestExecutionRequest({ tabId: currentTab }));
  }, [currentTab, dispatch, isRunning, execution]);

  const handleRefetchBuilds = useCallback(() => {
    if (!currentTab || !filters.deviceType) return;
    dispatch(
      fetchBuildsForDeviceTypeRequest({
        tabId: currentTab,
        deviceType: filters.deviceType,
      }),
    );
  }, [currentTab, filters.deviceType, dispatch]);

  return {
    filters,
    deviceFamilyOptions,
    deviceOptions,
    buildOptions,
    testPlanOptions,
    isLoadingDeviceFamilies,
    disableDeviceFamily,
    disableDevice,
    disableBuild,
    disableTestPlan,
    disableRun,
    isSubmitting,
    isLocked,
    isRunning,
    isCancelling,
    canRerun,
    hasSelection,
    handleDeviceFamilyChange,
    handleDeviceChange,
    handleBuildChange,
    handleTestPlanChange,
    handleRunOrStop,
    handleRefetchBuilds,
  };
}
