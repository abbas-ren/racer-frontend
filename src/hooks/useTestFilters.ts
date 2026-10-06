import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import { setTabFilters } from 'store/slices/testExecution/testExecutionsSlice';

export interface FilterOption {
  value: string;
  label: string;
}

export interface UseTestFiltersReturn {
  deviceFamily: string;
  device: string;
  build: string;
  testPlan: string;
  setDeviceFamily: (value: string) => void;
  setDevice: (value: string) => void;
  setBuild: (value: string) => void;
  setTestPlan: (value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function useTestFilters(tabId: string): UseTestFiltersReturn {
  const dispatch = useDispatch();
  const tab = useSelector(
    (state: RootState) => state.testExecutions.tabsById[tabId],
  );
  const deviceFamily = tab?.values.filters.deviceFamily ?? '';
  const device = tab?.values.filters.deviceID ?? '';
  const build = tab?.values.filters.buildID ?? '';
  const testPlan = tab?.values.filters.testPlan ?? '';

  const clearFilters = useCallback(() => {
    dispatch(
      setTabFilters({
        tabId,
        filters: {
          deviceFamily: '',
          deviceID: '',
          buildID: '',
          testPlan: null,
        },
      }),
    );
  }, [dispatch, tabId]);

  const setDeviceFamily = useCallback(
    (value: string) => {
      dispatch(setTabFilters({ tabId, filters: { deviceFamily: value } }));
    },
    [dispatch, tabId],
  );

  const setDevice = useCallback(
    (value: string) => {
      dispatch(setTabFilters({ tabId, filters: { deviceID: value } }));
    },
    [dispatch, tabId],
  );

  const setBuild = useCallback(
    (value: string) => {
      dispatch(setTabFilters({ tabId, filters: { buildID: value } }));
    },
    [dispatch, tabId],
  );

  const setTestPlan = useCallback(
    (value: string) => {
      dispatch(setTabFilters({ tabId, filters: { testPlan: value } }));
    },
    [dispatch, tabId],
  );

  const hasActiveFilters = !!(deviceFamily || device || build || testPlan);

  return {
    deviceFamily,
    device,
    build,
    testPlan,
    setDeviceFamily,
    setDevice,
    setBuild,
    setTestPlan,
    clearFilters,
    hasActiveFilters,
  };
}

export default useTestFilters;
