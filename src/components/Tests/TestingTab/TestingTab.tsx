import { useEffect } from 'react';
import { Box, Stack } from '@mui/material';
import TestFilters from 'components/Tests/TestFilters';
import TestSuiteList from 'components/Tests/TestSuiteList';
import ResizableDivider from 'components/Tests/ResizableDivider';
import useTestFilters from 'hooks/useTestFilters';
import useResizablePanel from 'hooks/useResizablePanel';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import {
  fetchDeviceFamiliesRequest,
  fetchDeviceTypesRequest,
  fetchBuildsRequest,
  fetchTabTestPlansRequest,
  fetchTabTestSuitesRequest,
} from 'store/slices/testExecution/testExecutionsSlice';
import styles from './TestingTab.module.scss';
import { TestStatus } from 'typesCustom/tests';
import ResultsMonitoring from '../ResultsMonitoring';

interface TestingTabProps {
  tabId: string;
  isActive: boolean;
}

function TestingTab({ tabId, isActive }: TestingTabProps) {
  const dispatch = useDispatch();
  const { testPlan } = useTestFilters(tabId);

  const tab = useSelector(
    (state: RootState) => state.testExecutions.tabsById[tabId],
  );
  const fullExecution = useSelector(
    (state: RootState) =>
      state.testExecutions.tabsById[tabId]?.values.data.testExecution ?? null,
  );

  // Derive lightweight execution state from Redux (no direct API calls)
  const execution = fullExecution
    ? {
        testId: String(fullExecution.testId),
        status: fullExecution.status as TestStatus,
      }
    : null;

  // Resizable panel management
  const { leftWidth, isDragging, handleMouseDown, rightWidth } =
    useResizablePanel(60, 75, 25, 40, 75);

  // Load device families immediately when tab becomes active
  useEffect(() => {
    if (!isActive || !tabId) return;

    const hasFamilies = tab?.values.data.deviceFamilies.items.length ?? 0;
    const isLoading = tab?.values.data.deviceFamilies.loading ?? false;

    console.log('[TestingTab] Tab active check:', {
      tabId,
      hasFamilies,
      isLoading,
      tabExists: !!tab,
    });

    // Always fetch if no families exist
    if (hasFamilies === 0) {
      console.log(
        '[TestingTab] Dispatching fetchDeviceFamiliesRequest for tab:',
        tabId,
      );
      dispatch(fetchDeviceFamiliesRequest({ tabId }));
    }
  }, [dispatch, isActive, tabId, tab]);

  // On active tab change, saga fetches latest execution; component simply reads from Redux

  // Load device types if deviceFamily is "ALL" or has a value
  useEffect(() => {
    if (!isActive || !tabId || !tab) return;

    const deviceFamily = tab.values.filters.deviceFamily;
    const hasDeviceTypes = tab.values.data.deviceTypes.items.length ?? 0;
    const isLoadingTypes = tab.values.data.deviceTypes.loading ?? false;

    console.log('[TestingTab] Device family check:', {
      tabId,
      deviceFamily,
      hasDeviceTypes,
      isLoadingTypes,
    });

    // If deviceFamily is set (including "ALL"), fetch device types immediately if not loaded
    if (deviceFamily && hasDeviceTypes === 0 && !isLoadingTypes) {
      console.log(
        '[TestingTab] Dispatching fetchDeviceTypesRequest for tab:',
        tabId,
        'with deviceFamily:',
        deviceFamily,
      );
      dispatch(fetchDeviceTypesRequest({ tabId, deviceFamily }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    isActive,
    tabId,
    tab?.values.filters.deviceFamily,
    tab?.values.data.deviceTypes.items.length,
  ]);

  // Load builds if deviceType is set
  useEffect(() => {
    if (!isActive || !tabId || !tab) return;

    const deviceType = tab.values.filters.deviceType;
    const deviceBuilds = tab.values.data.deviceBuilds?.[deviceType] || [];
    const hasBuilds = deviceBuilds.length > 0;
    const isLoadingBuilds = tab.values.data.builds.loading ?? false;

    console.log('[TestingTab] Device type check:', {
      tabId,
      deviceType,
      hasBuilds,
      isLoadingBuilds,
    });

    // If deviceType is set, fetch builds immediately if not loaded
    if (deviceType && !hasBuilds && !isLoadingBuilds) {
      console.log(
        '[TestingTab] Dispatching fetchBuildsRequest for tab:',
        tabId,
        'with deviceType:',
        deviceType,
      );
      dispatch(fetchBuildsRequest({ tabId, deviceType }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    isActive,
    tabId,
    tab?.values.filters.deviceType,
    tab?.values.data.deviceBuilds,
    tab?.values.data.builds.loading,
  ]);

  // Load test plans once per tab (if not already loaded)
  useEffect(() => {
    if (isActive && tabId && tab) {
      const hasPlans = tab.values.data.testPlans.items.length > 0;
      const isLoading = tab.values.data.testPlans.loading;
      const hasBuild = !!tab.values.filters.buildID;

      if (hasBuild && !hasPlans && !isLoading) {
        dispatch(fetchTabTestPlansRequest({ tabId }));
      }
    }
  }, [dispatch, isActive, tabId, tab]);

  // Fetch suites when test plan is selected
  useEffect(() => {
    if (!tabId || !testPlan || !isActive) return;
    const numericPlanId = Number(testPlan);
    if (!Number.isFinite(numericPlanId)) return;

    const hasSuites = (tab?.values.data.testSuites.items.length ?? 0) > 0;
    const isLoading = tab?.values.data.testSuites.loading ?? false;
    const lastFetchedPlanId = tab?.values.data.lastFetchedPlanId ?? null;
    const suitesLoaded = tab?.values.data.testSuitesLoaded ?? false;

    // Fetch only once per plan selection; even if empty, mark loaded to avoid loops
    if (
      !hasSuites &&
      !isLoading &&
      (!suitesLoaded || lastFetchedPlanId !== numericPlanId)
    ) {
      dispatch(fetchTabTestSuitesRequest({ tabId, planId: numericPlanId }));
    }
  }, [
    dispatch,
    tabId,
    testPlan,
    isActive,
    tab?.values.data.testSuites.items.length,
    tab?.values.data.testSuites.loading,
    tab?.values.data.lastFetchedPlanId,
    tab?.values.data.testSuitesLoaded,
  ]);

  if (!isActive) {
    return null;
  }

  return (
    <Stack className={styles.container}>
      <TestFilters execution={execution ?? undefined} />

      {/* Resizable Panels */}
      <Box className={styles.panelsContainer} data-resizable-container>
        {/* Left Panel - Test Suite List */}
        <Box className={styles.leftPanel} style={{ width: `${leftWidth}%` }}>
          <TestSuiteList
            execution={execution ?? undefined}
            isSubmittingExecution={tab?.isSubmittingExecution ?? false}
          />
        </Box>

        {/* Resizable Divider */}
        <ResizableDivider
          onMouseDown={handleMouseDown}
          isDragging={isDragging}
        />

        {/* Right Panel - Future: Results Monitoring */}
        <Stack
          className={styles.rightPanel}
          style={{ width: `${rightWidth}%` }}
        >
          <ResultsMonitoring
            execution={fullExecution ?? undefined}
            currentTabId={tabId}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

export default TestingTab;
